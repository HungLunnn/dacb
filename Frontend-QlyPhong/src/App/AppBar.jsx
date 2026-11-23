import MuiAppBar from "@mui/material/AppBar";
import { styled } from "@mui/material/styles";

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  height: "72px",
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  transition: "none",
}));

export default AppBar;
