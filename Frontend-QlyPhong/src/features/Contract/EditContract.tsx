import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  FormHelperText,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader";
import { useUpdateContract } from "../../hooks";
import useUser from "../../hooks/useUser";
import { createContractSchema } from "../../constants/schema";
import { ApiRoutes, AppRoutes, QK_APARTMENTS, QK_CONTRACTS, QK_CUSTOMERs } from "../../constants";
import { Api } from "../../api";
import { formatCurrency } from "../../utils/stringFormats";

const EditContract = () => {
  const location = useLocation();
  const from = location?.state?.from || AppRoutes.Contract;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const originalContract = useLoaderData() as ContractResponseDTO;
  const [_errors, setErrors] = useState("");
  const isTerminated = originalContract?.status === "TERMINATED";

  const __defaultValue: ContractInputs = useMemo(
    () => ({
      customerId: originalContract.customerId,
      endDate: dayjs(originalContract.endDate).toDate(),
      startDate: dayjs(originalContract.startDate).toDate(),
      apartmentId: originalContract.apartmentId,
    }),
    [originalContract]
  );

  const { mutate, isPending } = useUpdateContract({
    onSuccess(data) {
      if (data?.statusCode === 200 || data?.statusCode === 201) {
        toast.success("Cập nhật hợp đồng thành công");
        queryClient.invalidateQueries({ queryKey: [QK_CONTRACTS] });
        queryClient.invalidateQueries({ queryKey: [QK_APARTMENTS] });
        window.dispatchEvent(new Event("notifications-updated"));
        navigate(from);
      } else {
        setErrors(data?.message || "Không thể cập nhật hợp đồng");
      }
    },
  });

  const { data: customers = [], isLoading: isCustomersLoading } = useInfiniteQuery({
    queryKey: [QK_CUSTOMERs, "edit-contract"],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
      Api.fetch<CustomerApiResponse>(ApiRoutes.customer.GetAll, { page: pageParam, pageSize: 100 }).then(
        (value) => ({
          data: value.customers,
          currentPage: value.page.pageNumber,
          nextPage: value.page.last ? null : value.page.pageNumber + 1,
        })
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (data) =>
      data?.pages.flatMap((page) =>
        page.data.map((item) => ({
          value: item.id,
          label: `${item.fullName} - ${item.phoneNumber}`,
        }))
      ) || [],
  });

  const { data: apartments = [], isLoading: isApartmentsLoading } = useInfiniteQuery({
    queryKey: [QK_APARTMENTS, "edit-contract"],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
      Api.fetch<ApartmentApiResponse>(ApiRoutes.apartment.GetAll, { page: pageParam, pageSize: 100 }).then(
        (value) => ({
          data: value.apartments,
          currentPage: value.page.pageNumber,
          nextPage: value.page.last ? null : value.page.pageNumber + 1,
        })
      ),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (data) =>
      data?.pages.flatMap((page) =>
        page.data.map((item) => ({
          value: item.id,
          label: `${item.address} (${item.numberOfRoom} phòng - ${formatCurrency(item.retailPrice)}/tháng)`,
        }))
      ) || [],
  });

  const { handleSubmit, control } = useForm<ContractInputs>({
    defaultValues: __defaultValue,
    resolver: yupResolver<ContractInputs>(createContractSchema),
  });

  const onSubmitNew: SubmitHandler<ContractInputs> = (_data, event) => {
    event?.preventDefault();
    setErrors("");
    const dto: ContractDTO = {
      customerId: _data.customerId,
      apartmentId: _data.apartmentId,
      startDate: dayjs(_data.startDate).format("YYYY-MM-DD"),
      endDate: dayjs(_data.endDate).format("YYYY-MM-DD"),
      userId: user?.id || originalContract.userId,
    };
    mutate({ data: dto, id: originalContract.id });
  };

  return (
    <>
      <PageHeader>Chỉnh sửa hợp đồng</PageHeader>
      {isTerminated && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: 920 }}>
          Hợp đồng này đã được thanh lý trước hạn ({originalContract.terminatedAt}) và không thể chỉnh sửa.
        </Alert>
      )}
      {!!_errors && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 920 }}>
          {_errors}
        </Alert>
      )}
      <Card sx={{ maxWidth: 920, borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Thông tin hợp đồng
          </Typography>
          <form onSubmit={handleSubmit(onSubmitNew)}>
            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="customerId"
                render={({ field: { onChange, name, value }, fieldState: { error } }) => (
                  <Box>
                    <FormLabel htmlFor={name} sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                      Khách thuê
                    </FormLabel>
                    <Autocomplete
                      disabled={isTerminated}
                      loading={isCustomersLoading}
                      options={customers}
                      value={customers.find((c) => c.value === value) || null}
                      onChange={(_, v) => onChange(v?.value || "")}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      renderInput={(params) => <TextField {...params} error={!!error} />}
                    />
                    <FormHelperText error={!!error}>
                      {error ? error.message : "Chọn khách hàng đứng tên hợp đồng"}
                    </FormHelperText>
                  </Box>
                )}
              />

              <Controller
                control={control}
                name="apartmentId"
                render={({ field: { onChange, name, value }, fieldState: { error } }) => (
                  <Box>
                    <FormLabel htmlFor={name} sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                      Phòng trọ
                    </FormLabel>
                    <Autocomplete
                      disabled={isTerminated}
                      loading={isApartmentsLoading}
                      options={apartments}
                      value={apartments.find((a) => a.value === value) || null}
                      onChange={(_, v) => onChange(v?.value || "")}
                      isOptionEqualToValue={(o, v) => o.value === v.value}
                      renderInput={(params) => <TextField {...params} error={!!error} />}
                    />
                    <FormHelperText error={!!error}>
                      {error ? error.message : "Chọn phòng trọ thuộc hợp đồng"}
                    </FormHelperText>
                  </Box>
                )}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Box flex={1}>
                  <FormLabel htmlFor="startDate" sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                    Ngày bắt đầu
                  </FormLabel>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                        <DatePicker
                          {...field}
                          disabled={isTerminated}
                          format="DD-MM-YYYY"
                          value={dayjs(field.value)}
                          onChange={(value) => field.onChange(value?.toDate())}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              error: !!error,
                              helperText: error?.message,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Box>

                <Box flex={1}>
                  <FormLabel htmlFor="endDate" sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                    Ngày kết thúc
                  </FormLabel>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                        <DatePicker
                          {...field}
                          disabled={isTerminated}
                          format="DD-MM-YYYY"
                          value={dayjs(field.value)}
                          onChange={(value) => field.onChange(value?.toDate())}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              error: !!error,
                              helperText: error?.message,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Box>
              </Stack>

              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                <Button onClick={() => navigate(from)} disabled={isPending}>
                  Quay lại
                </Button>
                {!isTerminated && (
                  <Button type="submit" variant="contained" disableElevation disabled={isPending}>
                    {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                )}
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default EditContract;
