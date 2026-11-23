import { styled } from "@mui/material/styles";

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  minHeight: "100vh",
  padding: theme.spacing(3),
  marginTop: "72px",
  backgroundColor: theme.palette.background.default,
}));

export default Main;
