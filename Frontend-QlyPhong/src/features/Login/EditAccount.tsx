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
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { ObjectSchema, boolean, object, string } from "yup";
import {
  NM_WARNING,
  QK_ACCOUNT,
  QK_CONTRACTS,
  QK_USERS,
  REGEX_VALID_PHONE_NUMBER,
  UserRoles,
  UserRoutes,
} from "../../constants";
import RHFOutlinedTextField from "../../components/inputs/RHFTextField";
import { useUpdateUser } from "../../hooks/user";
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

const EditAccount = () => {
  const { user, refetch } = useUser();
  const queryClient = useQueryClient();
  const location = useLocation();
  const from = location?.state?.from || "/";
  const navigate = useNavigate();

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

  const { mutate } = useUpdateUser({
    async onSuccess(data) {
      if (data.statusCode == 200 || data.statusCode == 201) {
        setErrors("");
        toast.success("Cập nhật tài khoản thành công");
        await queryClient.invalidateQueries({ queryKey: [QK_ACCOUNT] });
        await queryClient.invalidateQueries({ queryKey: [QK_USERS] });
        await queryClient.invalidateQueries({ queryKey: [QK_CONTRACTS] });
        await refetch?.();
        window.dispatchEvent(new Event("notifications-updated"));
        navigate(from || UserRoutes.index);
      } else {
        console.log(data.statusCode, data.message);
        setErrors(data.message);
        toast.error(data.message);
      }
    },
    onError(error: any) {
      const msg = error?.response?.data?.message || error?.message || "Cập nhật tài khoản thất bại";
      setErrors(msg);
      toast.error(msg);
    },
  });

  const { handleSubmit, control, setValue, getValues, reset } = useForm<UserUpdateDTO>({
    resolver: yupResolver(schema),
    defaultValues: __defaultValues,
  });

  useEffect(() => {
    if (user) {
      reset({
        active: user.active ?? true,
        email: user.email || "",
        fullName: user.fullName || "",
        role: user.role || UserRoles.USER,
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<UserUpdateDTO> = async (data, event) => {
    event?.preventDefault();

    mutate({
      id: user?.id as string,
      data: {
        ...data,
        phoneNumber: data.phoneNumber.trim(),
      },
    });
  };

  const handleDisableAccount = () => {
    const __active: boolean = getValues()["active"];
    const wn_cntn: WarningDialogProps = {
      title: `Confirm disabling account?`,
    };
    NiceModal.show(NM_WARNING, { props: wn_cntn })
      .then(() => {
        setValue("active", !__active);

        onSubmit(getValues());
      })
      .catch(null);
  };

  return (
    <>
      <PageHeader>Edit Account</PageHeader>
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
              </>
            )}
          />
        </Box>
        <Box>
          {!!getValues()["active"] && (
            <Button
              onClick={handleDisableAccount}
              variant="outlined"
              disabled={user?.role != UserRoles.MANAGER}>
              Disable account
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => navigate("changePassword", { state: { from: location } })}>
            Change password
          </Button>
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
                <Select
                  {...field}
                  fullWidth
                  label="Role"
                  disabled={user?.role != UserRoles.MANAGER}>
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

export default EditAccount;
