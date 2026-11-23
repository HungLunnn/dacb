import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import privateInstance from "../api/privateInstance";
import useUser from "../hooks/useUser";
import { NotificationRoutes } from "../constants";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  recipientPhone?: string;
};

const getTypeBadge = (type: string): { label: string; color: "primary" | "success" | "error" | "warning" | "default" } => {
  switch (type) {
    case "CONTRACT_CREATED":
      return { label: "Hợp đồng mới", color: "primary" };
    case "CONTRACT_UPDATED":
      return { label: "Cập nhật HĐ", color: "warning" };
    case "CONTRACT_TERMINATED":
      return { label: "Thanh lý HĐ", color: "error" };
    case "INVOICE_CREATED":
    case "UTILITY_INVOICE_CREATED":
      return { label: "Hóa đơn mới", color: "warning" };
    case "INVOICE_PAID":
      return { label: "Đã thanh toán", color: "success" };
    default:
      return { label: "Hệ thống", color: "default" };
  }
};

const NotificationBell = () => {
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await privateInstance.get(NotificationRoutes.GetAll, {
        params: { page: 0, pageSize: 20 },
      });
      const data = response.data?.data;
      setItems(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    const handleRefresh = () => {
      loadNotifications();
    };
    window.addEventListener("notifications-updated", handleRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("notifications-updated", handleRefresh);
    };
  }, [loadNotifications, user?.id, user?.phoneNumber]);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
  };

  const markRead = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    try {
      await privateInstance.post(`${NotificationRoutes.GetAll}/${notification.id}/read`);
      await loadNotifications();
    } catch {
      // ignore read failure
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await privateInstance.post(NotificationRoutes.ReadAll);
      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={openMenu} aria-label="Thông báo">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 400, maxWidth: "92vw", maxHeight: 500 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={700}>Thông báo</Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon fontSize="small" />}
                disabled={markingAll}
                onClick={markAllRead}
                sx={{ textTransform: "none" }}
              >
                Đọc tất cả
              </Button>
            )}
          </Stack>
          {user?.phoneNumber && (
            <Typography fontSize="0.75rem" color="text.secondary">
              SĐT nhận thông báo: {user.phoneNumber}
            </Typography>
          )}
        </Box>
        <Divider />
        {items.length === 0 ? (
          <MenuItem disabled>Chưa có thông báo</MenuItem>
        ) : (
          items.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <MenuItem
                key={item.id}
                onClick={() => markRead(item)}
                sx={{
                  alignItems: "flex-start",
                  whiteSpace: "normal",
                  py: 1.25,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  backgroundColor: item.isRead ? "transparent" : "rgba(83, 0, 0, 0.05)",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mb={0.25}>
                    <Typography fontSize="0.88rem" fontWeight={item.isRead ? 500 : 700}>
                      {item.title}
                    </Typography>
                    <Chip size="small" label={badge.label} color={badge.color} sx={{ height: 20, fontSize: "0.7rem" }} />
                  </Stack>
                  <Typography fontSize="0.82rem" color="text.secondary">
                    {item.message}
                  </Typography>
                  {item.createdAt && (
                    <Typography fontSize="0.72rem" color="text.disabled" sx={{ mt: 0.35 }}>
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
