import { Box, Toolbar, Typography, Stack, Button, Divider } from "@mui/material";
import { Outlet, Link, useLocation } from "react-router-dom";
import AppsIcon from "@mui/icons-material/Apps";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import PeopleIcon from "@mui/icons-material/People";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import React from "react";

import Main from "./Main";
import AppBar from "./AppBar";
import UserNavPanel from "../features/user/UserNavPanel";
import useUser from "../hooks/useUser";
import { AppRoutes } from "../constants";
import NotificationBell from "../components/NotificationBell";

const navItems = [
  { label: "Overview", icon: <AppsIcon fontSize="small" />, link: "/" },
  { label: "Customers", icon: <PeopleIcon fontSize="small" />, link: AppRoutes.Customer },
  { label: "Apartments", icon: <HolidayVillageIcon fontSize="small" />, link: AppRoutes.Apartment },
  { label: "Contracts", icon: <ReceiptLongIcon fontSize="small" />, link: AppRoutes.Contract },
  { label: "Invoices", icon: <ReceiptLongIcon fontSize="small" />, link: AppRoutes.Invoice },
];

const Layout = ({ children }) => {
  const { isAdmin, user } = useUser();
  const isStaffOrAdmin = isAdmin || user?.role === "STAFF";
  const location = useLocation();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar
          sx={{
            minHeight: "72px !important",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.3,
                color: "text.primary",
                fontSize: { xs: "1rem", md: "1.1rem" },
              }}>
              Quản lý thuê trọ
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            {navItems.map((item) => {
              if (item.link === AppRoutes.Customer && !isStaffOrAdmin) return null;
              const selected =
                item.link === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.link);

              return (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.link}
                  startIcon={item.icon}
                  sx={{
                    minWidth: "auto",
                    px: 1.75,
                    py: 1,
                    borderRadius: 999,
                    color: selected ? "primary.main" : "text.secondary",
                    backgroundColor: selected ? "rgba(83, 0, 0, 0.06)" : "transparent",
                    fontWeight: selected ? 700 : 500,
                    textTransform: "none",
                    transition: "none",
                    "&:hover": {
                      backgroundColor: "rgba(83, 0, 0, 0.04)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            {isAdmin ? (
              <Button
                component={Link}
                to="/users"
                startIcon={<ContactPageIcon fontSize="small" />}
                sx={{
                  minWidth: "auto",
                  px: 1.75,
                  py: 1,
                  borderRadius: 999,
                  color: location.pathname.startsWith("/users") ? "primary.main" : "text.secondary",
                  backgroundColor: location.pathname.startsWith("/users") ? "rgba(83, 0, 0, 0.06)" : "transparent",
                  fontWeight: location.pathname.startsWith("/users") ? 700 : 500,
                  textTransform: "none",
                  transition: "none",
                  "&:hover": {
                    backgroundColor: "rgba(83, 0, 0, 0.04)",
                  },
                }}
              >
                Users
              </Button>
            ) : null}
          </Stack>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationBell />
            <UserNavPanel />
          </Box>
        </Toolbar>
      </AppBar>

      <Main>{children ?? <Outlet />}</Main>
    </>
  );
};

export default Layout;
