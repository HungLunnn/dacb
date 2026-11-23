import { useState } from "react";
import { Alert, Button, Link, Stack } from "@mui/material";
import { ObjectSchema, object, string } from "yup";
import { SubmitHandler, useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import LoginLayout from "../../components/LoginLayout";
import RHFOutlinedTextField from "../../components/inputs/RHFTextField";
import ToggleablePasswordTextField from "../../components/inputs/ToggleablePasswordTextField";
import AuthApi from "../../api/auth";
import { AppRoutes, REGEX_VALID_PHONE_NUMBER } from "../../constants";

interface RegisterInputs {
  email: string;
  fullName: string;
  password: string;
  password_repeat: string;
  phoneNumber: string;
}

const schema: ObjectSchema<RegisterInputs> = object({
  email: string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
  fullName: string().trim().required("Vui lòng nhập họ tên"),
  password: string().required("Vui lòng nhập mật khẩu").min(6, "Mật khẩu tối thiểu 6 ký tự"),
  password_repeat: string().required("Vui lòng nhập lại mật khẩu"),
  phoneNumber: string()
    .trim()
    .required("Vui lòng nhập số điện thoại")
    .matches(REGEX_VALID_PHONE_NUMBER, "Số điện thoại Việt Nam không hợp lệ (10 số, vd: 0912345678)"),
});

const RegisterPage = () => {
  const { control, handleSubmit, setError } = useForm<RegisterInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      password_repeat: "",
      phoneNumber: "",
    },
  });

  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit: SubmitHandler<RegisterInputs> = async (data) => {
    setServerError("");
    if (data.password !== data.password_repeat) {
      setError("password_repeat", { message: "Mật khẩu nhập lại không khớp" }, { shouldFocus: true });
      return;
    }

    setSubmitting(true);
    try {
      const res = await AuthApi.register({
        email: data.email.trim(),
        fullName: data.fullName.trim(),
        password: data.password,
        phoneNumber: data.phoneNumber.trim(),
      });

      if (res?.statusCode === 200 || res?.statusCode === 201) {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        navigate(AppRoutes.Login);
      } else {
        const msg = res?.message || "Không thể tạo tài khoản";
        setServerError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err?.response ? `Lỗi máy chủ (${err.response.status})` : err?.message || "Không kết nối được tới máy chủ Backend (cổng 9090).");
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LoginLayout title={"Đăng ký tài khoản"}>
      <Stack spacing={2} component={"form"} onSubmit={handleSubmit(onSubmit)}>
        {!!serverError && <Alert severity="error">{serverError}</Alert>}
        <RHFOutlinedTextField control={control} name="fullName" label="Họ và tên" variant={"outlined"} />
        <RHFOutlinedTextField control={control} name="email" label="Email" variant={"outlined"} />
        <RHFOutlinedTextField
          control={control}
          name="phoneNumber"
          label="Số điện thoại (vd: 0912345678)"
          variant={"outlined"}
        />

        <Controller
          name={"password"}
          control={control}
          render={({ field, fieldState }) => (
            <ToggleablePasswordTextField
              {...field}
              label="Mật khẩu"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name={"password_repeat"}
          control={control}
          render={({ field, fieldState }) => (
            <ToggleablePasswordTextField
              {...field}
              label="Nhập lại mật khẩu"
              error={!!fieldState.error}
              helperText={fieldState.error?.message || "Nhập lại mật khẩu giống ở trên"}
              fullWidth
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Đang đăng ký..." : "Đăng ký"}
        </Button>

        <Button LinkComponent={Link} href={AppRoutes.Login} variant="text">
          Đã có tài khoản? Đăng nhập
        </Button>
      </Stack>
    </LoginLayout>
  );
};

export default RegisterPage;
