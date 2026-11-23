import { Box, Button, FormLabel, InputAdornment, MenuItem, Select } from "@mui/material";
import React, { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { customerInputsSchema } from "../../constants/schema";
import { ObjectSchema, object, string } from "yup";
import { REGEX_VALID_PHONE_NUMBER, REGEX_VALID_USERNAME, QK_USERS, UserRoles, UserRoutes } from "../../constants";
import RHFOutlinedTextField from "../../components/inputs/RHFTextField";
import { useCreateUser } from "../../hooks/user";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

type Inputs = Omit<UserUpdateDTO, "active"> & Pick<User, "username">;

const schema: ObjectSchema<Inputs> = object({
  username: string().label("Username").required().default("").matches(REGEX_VALID_USERNAME),
  email: string().email().label("Email").required().default(""),
  fullName: string().label("Full name").required().default(""),
  role: string().label("Role").required().default(UserRoles.USER),
  phoneNumber: string()
    .trim()
    .label("Phone number")
    .required("Phone number is required")
    .matches(REGEX_VALID_PHONE_NUMBER, "Invalid phone number")
    .default(""),
});

const roleOptions = [...Object.values(UserRoles)].map((item) => (
  <MenuItem key={item} value={item}>
    {item}
  </MenuItem>
));

const CreateUser = () => {
  const location = useLocation();
  const from = location?.state?.from || UserRoutes.index;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [_errors, setErrors] = useState("");

  const { handleSubmit, control } = useForm<Inputs>({
    resolver: yupResolver(schema),
    defaultValues: schema.getDefault(),
  });

  const { mutate } = useCreateUser({
    onSuccess(data) {
      if (data?.statusCode == 200 || data?.statusCode == 201) {
        toast.success("Tạo tài khoản thành công");
        queryClient.invalidateQueries({ queryKey: [QK_USERS] });
        navigate(from || UserRoutes.index);
      } else {
        setErrors(data?.message || "Không thể tạo tài khoản");
        toast.error(data?.message || "Không thể tạo tài khoản");
      }
    },
  });

  const onSubmit: SubmitHandler<Inputs> = async (data, event) => {
    event?.preventDefault();
    mutate(data);
  };

  return (
    <>
      <PageHeader>Create User</PageHeader>
      {!!_errors && <Box sx={{ border: "solid red 1px", color: "red" }}>{_errors}</Box>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <RHFOutlinedTextField
          fullWidth
          variant="outlined"
          name="username"
          label="Username"
          control={control}
          margin="dense"
          InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }}
        />
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

export default CreateUser;
