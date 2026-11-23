import {
  MRT_ColumnDef,
  MRT_PaginationState,
  MRT_Row,
  MRT_SortingState,
  MRT_TableInstance,
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NiceModal from "@ebay/nice-modal-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import ErrorPlaceHolder from "../../components/placeholder/ErrorPlaceHolder";
import TableLoading from "../../components/placeholder/TableLoading";
import MRTTableRowActions from "../../components/MRTRowAction";
import { useDeleteContract, useGetContracts, useTerminateContract } from "../../hooks";
import getDefaultMRTOptions from "../../utils/defaultMRTOptions";
import { formatCurrency } from "../../utils/stringFormats";
import { NM_WARNING, QK_APARTMENTS, QK_CONTRACTS } from "../../constants";
import useUser from "../../hooks/useUser";
import { WarningDialogProps } from "../../types/props";

const STATUS_META: Record<
  string,
  { label: string; color: "success" | "error" | "default" | "warning" }
> = {
  ACTIVE: { label: "Đang hiệu lực", color: "success" },
  DRAFT: { label: "Chờ hiệu lực", color: "warning" },
  EXPIRED: { label: "Đã hết hạn", color: "default" },
  TERMINATED: { label: "Đã thanh lý", color: "error" },
};

const columnDefs: MRT_ColumnDef<Contract>[] = [
  { accessorKey: "customer.fullName", header: "Khách thuê" },
  { accessorKey: "apartment.address", header: "Phòng trọ" },
  {
    accessorKey: "retailPrice",
    header: "Giá thuê/tháng",
    Cell: ({ cell }) => formatCurrency(cell.getValue<number>()),
  },
  {
    accessorKey: "total",
    header: "Tổng giá trị",
    Cell: ({ cell }) => formatCurrency(cell.getValue<number>()),
  },
  {
    id: "duration",
    header: "Thời hạn thuê",
    Cell: ({ row }) => (
      <span>
        {row.original.startDate} → {row.original.endDate}
      </span>
    ),
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Trạng thái",
    Cell: ({ cell }) => {
      const status = cell.getValue<string>() || "DRAFT";
      const meta = STATUS_META[status] || { label: status, color: "default" as const };
      return <Chip size="small" color={meta.color} label={meta.label} />;
    },
  },
];

const DetailPanel = ({
  row,
}: {
  row: MRT_Row<Contract>;
  table: MRT_TableInstance<Contract>;
}) => {
  const { isAdmin, user: currentUser } = useUser();
  const contract = row.original;
  const user = contract.user;
  const canViewUserInfo = isAdmin || user?.username === currentUser?.username;
  const apartment = contract.apartment;
  const customer = contract.customer;
  const statusMeta = STATUS_META[contract.status || "DRAFT"] || {
    label: contract.status || "DRAFT",
    color: "default" as const,
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: "background.default" }}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Thông tin hợp đồng
          </Typography>
          <Stack spacing={0.75} fontSize="0.9rem">
            <Typography variant="body2">
              <b>Mã HĐ:</b> {contract.id}
            </Typography>
            <Typography variant="body2">
              <b>Ngày lập:</b> {contract.createDate || "—"}
            </Typography>
            <Typography variant="body2">
              <b>Thời hạn:</b> {contract.startDate} → {contract.endDate}
            </Typography>
            <Typography variant="body2">
              <b>Tổng giá trị:</b> {formatCurrency(contract.total)}
            </Typography>
            <Box>
              <Chip size="small" color={statusMeta.color} label={statusMeta.label} />
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Khách thuê & Phòng trọ
          </Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2">
              <b>Khách hàng:</b> {customer?.fullName}
            </Typography>
            <Typography variant="body2">
              <b>SĐT:</b> {customer?.phoneNumber || "—"}
            </Typography>
            <Typography variant="body2">
              <b>CCCD:</b> {customer?.citizenId || "—"}
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="body2">
              <b>Địa chỉ phòng:</b> {apartment?.address}
            </Typography>
            <Typography variant="body2">
              <b>Giá phòng:</b> {formatCurrency(apartment?.retailPrice)}/tháng
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          {contract.status === "TERMINATED" && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>
                Đã thanh lý trước hạn
              </Typography>
              <Typography variant="body2">
                <b>Ngày thanh lý:</b> {contract.terminatedAt || "—"}
              </Typography>
              <Typography variant="body2">
                <b>Lý do:</b> {contract.terminationReason || "Không ghi nhận lý do"}
              </Typography>
            </Alert>
          )}

          {canViewUserInfo && user && (
            <>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Người lập hợp đồng
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <b>Họ tên:</b> {user.fullName}
                </Typography>
                <Typography variant="body2">
                  <b>Tài khoản:</b> {user.username}
                </Typography>
                {isAdmin && (
                  <Typography variant="body2">
                    <b>Vai trò:</b> {user.role}
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

const ContractList = () => {
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const client = useQueryClient();
  const navigate = useNavigate();
  const { user, isAdmin } = useUser();
  const isStaffOrManager = isAdmin || user?.role === "STAFF";

  const {
    isLoading,
    isError,
    isRefetching,
    data: { contracts = [], meta } = {},
    error,
    refetch,
  } = useGetContracts({
    variables: {
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sortBy: sorting?.map((value) => value.id).toString() || undefined,
      q: globalFilter || undefined,
    },
  });

  const [terminationContract, setTerminationContract] = useState<Contract | null>(null);
  const [terminatedAt, setTerminatedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [terminationReason, setTerminationReason] = useState("");

  const deleteMutation = useDeleteContract({
    onSuccess(data) {
      if (data?.statusCode === 200) {
        toast.success("Đã xóa hợp đồng");
        client.invalidateQueries({ queryKey: [QK_CONTRACTS] });
        client.invalidateQueries({ queryKey: [QK_APARTMENTS] });
        refetch();
      } else {
        toast.error(data?.message || "Không thể xóa hợp đồng");
      }
    },
  });

  const terminateMutation = useTerminateContract({
    onSuccess(data) {
      if (data?.statusCode === 200) {
        toast.success("Thanh lý hợp đồng thành công");
        setTerminationContract(null);
        setTerminationReason("");
        client.invalidateQueries({ queryKey: [QK_CONTRACTS] });
        client.invalidateQueries({ queryKey: [QK_APARTMENTS] });
        refetch();
        window.dispatchEvent(new Event("notifications-updated"));
      } else {
        toast.error(data?.message || "Không thể thanh lý hợp đồng");
      }
    },
  });

  const handleDeleteContract = (contract: Contract) => {
    const wn_cntn: WarningDialogProps = {
      title: "Xác nhận xóa hợp đồng?",
      content: `Bạn có chắc muốn xóa hợp đồng của khách "${contract.customer?.fullName}" tại phòng "${contract.apartment?.address}"?`,
    };
    NiceModal.show(NM_WARNING, { props: wn_cntn }).then(() => {
      deleteMutation.mutate({ id: contract.id });
    });
  };

  const openTerminateDialog = (contract: Contract) => {
    setTerminationContract(contract);
    setTerminatedAt(new Date().toISOString().slice(0, 10));
    setTerminationReason("");
  };

  const table = useMaterialReactTable<Contract>({
    ...getDefaultMRTOptions<Contract>({
      setGlobalFilter,
      setPagination,
      setSorting,
      refetch,
    }),
    manualFiltering: true,
    columns: columnDefs,
    data: contracts,
    rowCount: meta?.totalRowCount ?? 0,
    state: {
      isLoading,
      pagination,
      globalFilter,
      showAlertBanner: isError,
      showProgressBars: isLoading || isRefetching,
      sorting,
    },
    enableExpanding: true,
    enableExpandAll: false,
    renderDetailPanel: ({ row, table }) => <DetailPanel row={row} table={table} />,
    renderRowActions: ({ row }) => {
      const item = row.original;
      const canTerminate =
        isStaffOrManager && (item.status === "ACTIVE" || item.status === "DRAFT");
      const canEdit = isStaffOrManager && item.status !== "TERMINATED";
      const canDelete = isAdmin && item.status !== "ACTIVE";

      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <MRTTableRowActions
            onEditItem={
              canEdit
                ? () => navigate(`./${item.id}/edit`, { state: { from: window.location.pathname } })
                : undefined
            }
            onDeleteItem={canDelete ? () => handleDeleteContract(item) : undefined}
          />
          {canTerminate && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => openTerminateDialog(item)}
            >
              Thanh lý
            </Button>
          )}
        </Stack>
      );
    },
  });

  if (isLoading) return <TableLoading />;
  if (isError) {
    console.error(error || new Error("Error loading contracts"));
    return <ErrorPlaceHolder onClick={() => refetch()} />;
  }

  return (
    <>
      <MaterialReactTable table={table} />

      <Dialog
        open={!!terminationContract}
        onClose={() => !terminateMutation.isPending && setTerminationContract(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Thanh lý hợp đồng trước hạn</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          {terminationContract && (
            <Alert severity="info">
              <b>Khách thuê:</b> {terminationContract.customer?.fullName} — <b>Phòng:</b>{" "}
              {terminationContract.apartment?.address}
              <br />
              <b>Thời hạn hợp đồng:</b> {terminationContract.startDate} →{" "}
              {terminationContract.endDate}
            </Alert>
          )}
          <TextField
            label="Ngày thanh lý"
            type="date"
            value={terminatedAt}
            onChange={(event) => setTerminatedAt(event.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            helperText={
              terminationContract?.status === "ACTIVE"
                ? `Phải nằm trong khoảng ${terminationContract.startDate} đến ${terminationContract.endDate}`
                : "Ngày thanh lý không được vượt quá ngày kết thúc hợp đồng"
            }
          />
          <TextField
            label="Lý do thanh lý"
            multiline
            minRows={3}
            placeholder="Nhập lý do thanh lý hợp đồng trước hạn..."
            value={terminationReason}
            onChange={(event) => setTerminationReason(event.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setTerminationContract(null)}
            disabled={terminateMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!terminationContract || !terminatedAt || terminateMutation.isPending}
            onClick={() => {
              if (!terminationContract) return;
              terminateMutation.mutate({
                id: terminationContract.id,
                data: { terminatedAt, reason: terminationReason.trim() },
              });
            }}
          >
            {terminateMutation.isPending ? "Đang xử lý..." : "Xác nhận thanh lý"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContractList;
