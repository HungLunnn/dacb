import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormHelperText,
  FormLabel,
  Stack,
  Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import PageHeader from "../../components/PageHeader";
import { useCreateContract } from "../../hooks";
import useUser from "../../hooks/useUser";
import { createContractSchema } from "../../constants/schema";
import { AppRoutes, QK_APARTMENTS, QK_CONTRACTS } from "../../constants";
import SelectCustomer from "../../components/inputs/SelectCustomer";
import SelectApartment, { ApartmentOption } from "../../components/inputs/SelectApartment";
import { formatCurrency } from "../../utils/stringFormats";

const CreateContract = () => {
  const location = useLocation();
  const from = location?.state?.from || AppRoutes.Contract;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [_errors, setErrors] = useState("");
  const [selectedApartment, setSelectedApartment] = useState<ApartmentOption | null>(null);

  const { mutate, isPending } = useCreateContract({
    onSuccess(data) {
      if (data?.statusCode === 200 || data?.statusCode === 201) {
        toast.success("Tạo hợp đồng thành công");
        queryClient.invalidateQueries({ queryKey: [QK_CONTRACTS] });
        queryClient.invalidateQueries({ queryKey: [QK_APARTMENTS] });
        window.dispatchEvent(new Event("notifications-updated"));
        navigate(from);
      } else {
        setErrors(data?.message || "Không thể tạo hợp đồng");
      }
    },
  });

  const { handleSubmit, control, watch } = useForm<ContractInputs>({
    defaultValues: {
      apartmentId: "",
      customerId: "",
      startDate: dayjs().toDate(),
      endDate: dayjs().add(6, "month").toDate(),
    },
    resolver: yupResolver<ContractInputs>(createContractSchema),
  });

  const startDateWatch = watch("startDate");
  const endDateWatch = watch("endDate");
  const months =
    startDateWatch && endDateWatch
      ? Math.max(0, dayjs(endDateWatch).diff(dayjs(startDateWatch), "month"))
      : 0;
  const estimatedTotal = (selectedApartment?.retailPrice || 0) * months;

  const onSubmitNew: SubmitHandler<ContractInputs> = (_data, event) => {
    event?.preventDefault();
    setErrors("");

    const dto: ContractDTO = {
      customerId: _data.customerId,
      apartmentId: _data.apartmentId,
      startDate: dayjs(_data.startDate).format("YYYY-MM-DD"),
      endDate: dayjs(_data.endDate).format("YYYY-MM-DD"),
      userId: user?.id || "",
    };
    mutate(dto);
  };

  return (
    <>
      <PageHeader>Tạo hợp đồng thuê phòng</PageHeader>
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
                render={({ field: { onChange, name, ref }, fieldState: { error } }) => (
                  <Box>
                    <FormLabel htmlFor={name} sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                      Khách thuê
                    </FormLabel>
                    <SelectCustomer ref={ref} onChange={(_, v) => onChange(v?.value || "")} />
                    <FormHelperText error={!!error}>
                      {error ? error.message : "Chọn khách hàng đứng tên hợp đồng"}
                    </FormHelperText>
                  </Box>
                )}
              />

              <Controller
                control={control}
                name="apartmentId"
                render={({ field: { onChange, name, ref }, fieldState: { error } }) => (
                  <Box>
                    <FormLabel htmlFor={name} sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
                      Phòng trọ (phòng còn trống)
                    </FormLabel>
                    <SelectApartment
                      ref={ref}
                      onlyAvailable
                      error={!!error}
                      onChange={(_, v) => {
                        setSelectedApartment(v);
                        onChange(v?.value || "");
                      }}
                    />
                    <FormHelperText error={!!error}>
                      {error ? error.message : "Chỉ hiển thị các phòng hiện đang trống"}
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
                          format="DD-MM-YYYY"
                          value={dayjs(field.value)}
                          onChange={(value) => field.onChange(value?.toDate())}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              error: !!error,
                              helperText: error?.message || "Tối thiểu 1 tháng kể từ ngày bắt đầu",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Box>
              </Stack>

              <Divider />

              <Alert severity="info">
                <Typography variant="body2">
                  <b>Giá thuê/tháng:</b>{" "}
                  {selectedApartment ? formatCurrency(selectedApartment.retailPrice) : "Chưa chọn phòng"}{" "}
                  | <b>Thời hạn:</b> {months} tháng | <b>Tổng giá trị dự kiến:</b>{" "}
                  <b>{formatCurrency(estimatedTotal)}</b>
                </Typography>
              </Alert>

              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                <Button onClick={() => navigate(from)} disabled={isPending}>
                  Quay lại
                </Button>
                <Button type="submit" variant="contained" disableElevation disabled={isPending}>
                  {isPending ? "Đang tạo..." : "Tạo hợp đồng"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default CreateContract;
