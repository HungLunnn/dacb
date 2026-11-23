import { Box, Button, Stack, Typography } from "@mui/material";
import React from "react";
import useAuth from "../../hooks/useAuth";
import useUser from "../../hooks/useUser";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import EditIcon from "@mui/icons-material/Edit";
import NiceModal from "@ebay/nice-modal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NM_WARNING } from "../../constants";
import { WarningDialogProps } from "../../types/props";

const UserNavPanel = () => {
  const { logout } = useAuth();
  const { user, isAdmin } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const wn_ctnt: WarningDialogProps = {
      title: "Confirm logout?",
    };

    NiceModal.show(NM_WARNING, { props: wn_ctnt }).then(() => {
      logout();
      navigate("/login", { replace: true });
    });
  };

  const handleOnClickEdit = () => {
    navigate("account/edit", { state: { from: location } });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.25,
        py: 0.75,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "rgba(83, 0, 0, 0.02)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "text.primary",
          }}
        >
          {user?.fullName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            lineHeight: 1.2,
            color: "text.secondary",
          }}
        >
          {user?.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            lineHeight: 1.2,
            color: "text.secondary",
          }}
        >
          {user?.role}{user?.phoneNumber ? ` • ${user.phoneNumber}` : ""}
        </Typography>
      </Box>

      <Stack direction="row" spacing={0.5}>
        <Button size="small" startIcon={<EditIcon />} onClick={handleOnClickEdit} sx={{ minWidth: 0 }}>
          Edit
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={{ minWidth: 0 }}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );
};

export default UserNavPanel;
