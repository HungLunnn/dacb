import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Select,
} from "@mui/material";
import React, { useMemo, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import { customerInputsSchema } from "../../constants/schema";
import { ObjectSchema, boolean, object, string } from "yup";
import {
  ApiRoutes,
  CustomerRoutes,
  NM_WARNING,
  QK_ACCOUNT,
  QK_USERS,
  REGEX_VALID_PHONE_NUMBER,
  REGEX_VALID_USERNAME,
  UserRoles,
  UserRoutes,
} from "../../constants";
import RHFOutlinedTextField from "../../components/inputs/RHFTextField";
import { Api } from "../../api";
import { useToggleBlockUser, useUpdateUser } from "../../hooks/user";
import toast from "react-hot-toast";
import styled from "@emotion/styled";
import NiceModal from "@ebay/nice-modal-react";
import { WarningDialogProps } from "../../types/props";
import useUser from "../../hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";

const roleOptions = [...Object.values(UserRoles)].map((item) => (
  <MenuItem key={item} value={item}>
    {item}
  </MenuItem>
));

const VisuallyHiddenCheckbox = styled(Checkbox)({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const EditUser = () => {
  const user = useLoaderData() as User;
  const location = useLocation();
  const from = location?.state?.from || "/";
  const navigate = useNavigate();
  const { user: accountUser, refetch: refetchAccount } = useUser();
  const queryClient = useQueryClient();

  const [_errors, setErrors] = useState("");

  const schema: ObjectSchema<UserUpdateDTO> = object({
    active: boolean().required().default(true),
    email: string().email().label("Email").required().default(""),
    fullName: string().label("Full name").required().default(""),
    role: string().label("Role").required().default(UserRoles.USER),
    phoneNumber: string()
      .trim()
      .label("Số điện thoại")
      .required("Vui lòng nhập số điện thoại")
      .matches(REGEX_VALID_PHONE_NUMBER, "Số điện thoại không hợp lệ (10 số bắt đầu bằng 03, 05, 07, 08, 09)")
      .default(""),
  });

  const __defaultValues = useMemo(
    () => ({
      active: user?.active ?? true,
      email: user?.email || "",
      fullName: user?.fullName || "",
      role: user?.role || UserRoles.USER,
      phoneNumber: user?.phoneNumber || "",
    }),
    [user]
  );

  const isManager = useMemo(() => user.role == UserRoles.MANAGER, [user.role]);

  const { mutate } = useUpdateUser({
    async onSuccess(data) {
      if (data.statusCode == 200 || data.statusCode == 201) {
        setErrors("");
        toast.success("Cập nhật người dùng thành công");
        await queryClient.invalidateQueries({ queryKey: [QK_USERS] });
        if (accountUser?.id === user.id) {
          await queryClient.invalidateQueries({ queryKey: [QK_ACCOUNT] });
          await refetchAccount?.();
          window.dispatchEvent(new Event("notifications-updated"));
        }
        navigate(from || UserRoutes.index);
      } else {
        console.log(data.statusCode, data.message);
        setErrors(data.message);
        toast.error(data.message);
      }
    },
    onError(error: any) {
      const msg = error?.response?.data?.message || error?.message || "Cập nhật người dùng thất bại";
      setErrors(msg);
      toast.error(msg);
    },
  });

  const { mutate: toggle } = useToggleBlockUser({
    onSuccess(data) {
      if (data.statusCode == 200 || data.statusCode == 201) {
        toast.success(data.message);
        //  window.location.reload()
        navigate(from || UserRoutes.index);
      } else {
        console.log(data.statusCode, data.message);
        setErrors(data.message);
      }
    },
  });

  const { handleSubmit, control, setValue, getValues, formState } = useForm<UserUpdateDTO>({
    resolver: yupResolver(schema),
    defaultValues: __defaultValues || schema.getDefault() || {},
  });

  const onSubmit: SubmitHandler<UserUpdateDTO> = async (data, event) => {
    event?.preventDefault();

    mutate({ id: user.id, data: data });
  };

  const handleDisableAccount = () => {
    const __active: boolean = getValues()["active"];
    const wn_cntn: WarningDialogProps = {
      title: `Confirm ${__active ? "disabling" : "enabling"} account?`,
    };
    NiceModal.show(NM_WARNING, { props: wn_cntn })
      .then(() => {
        setValue("active", !__active);

        toggle({ active: __active, id: user.id });
      })
      .catch(null);
  };

  return (
    <>
      <PageHeader>Edit User</PageHeader>
      {!!_errors && <Box sx={{ border: "solid red 1px", color: "red" }}>{_errors}</Box>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box marginBlock={3}>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <>
                <FormLabel htmlFor={field.name}>Account status:</FormLabel>
                {field.value ? "Active" : "Inactive"}
                <VisuallyHiddenCheckbox
                  {...field}
                  checked={!!field.value}
                  // onChange={(e) => field.onChange(e.target.checked)}
                />
                {!isManager && accountUser?.id != user?.id && (
                  <Button onClick={handleDisableAccount} variant="outlined">
                    {`${field.value ? "Disable" : "Enable"} account`}
                  </Button>
                )}
              </>
            )}
          />
        </Box>
        <RHFOutlinedTextField
          fullWidth
          variant="outlined"
          name="fullName"
          label="Full name"
          control={control}
          margin="dense"
        />
        <RHFOutlinedTextField
          fullWidth
          variant="outlined"
          name="email"
          label="Email"
          control={control}
          margin="dense"
        />
        <RHFOutlinedTextField
          fullWidth
          variant="outlined"
          name="phoneNumber"
          label="Phone number"
          control={control}
          margin="dense"
        />
        <Box marginBlock={2}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <>
                <FormLabel htmlFor={field.name}>Role</FormLabel>
                <Select {...field} fullWidth label="Role">
                  {roleOptions}
                </Select>
              </>
            )}
          />
        </Box>
        <Box>
          <Button onClick={() => navigate(from)}>Go back</Button>
          <Button type="submit" variant="contained" disableElevation>
            Save
          </Button>
        </Box>
      </form>
    </>
  );
};

export default EditUser;
