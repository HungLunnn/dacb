import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import PageHeader from "../../components/PageHeader";
import useUser from "../../hooks/useUser";
import {
  fetchLatestMeter,
  useCancelInvoice,
  useCreateInvoice,
  useGetContracts,
  useGetInvoices,
  usePayInvoice,
} from "../../hooks";
import { QK_INVOICES } from "../../constants";

const formatMoney = (value?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; color: "warning" | "success" | "default" }
> = {
  UNPAID: { label: "Chưa thanh toán", color: "warning" },
  PAID: { label: "Đã thanh toán", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "default" },
};

const InvoicePage = () => {
  const { isAdmin, user } = useUser();
  const isStaffOrManager = isAdmin || user?.role === "STAFF";
  const queryClient = useQueryClient();

  // Form state
  const [contractId, setContractId] = useState("");
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [dueDate, setDueDate] = useState(() => dayjs().add(7, "day").format("YYYY-MM-DD"));
  const [electricOld, setElectricOld] = useState<number>(0);
  const [electricNew, setElectricNew] = useState<number>(0);
  const [waterOld, setWaterOld] = useState<number>(0);
  const [waterNew, setWaterNew] = useState<number>(0);
  const [electricRate, setElectricRate] = useState<number>(3000);
  const [waterRate, setWaterRate] = useState<number>(10000);
  const [meterHint, setMeterHint] = useState<string>("");

  // Filter & pagination state
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "">("");
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState<number | "">("");

  // Detail / print modal & cancel confirm modal
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  // Fetch active contracts for form dropdown (staff/manager only)
  const { data: contractData } = useGetContracts({
    variables: { page: 0, pageSize: 100 },
    enabled: isStaffOrManager,
  });

  const activeContracts = useMemo(
    () => (contractData?.contracts || []).filter((c) => c.status === "ACTIVE"),
    [contractData?.contracts]
  );

  // Fetch invoices with filters
  const {
    data: invoiceData,
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
  } = useGetInvoices({
    variables: {
      page,
      pageSize: 10,
      status: filterStatus || undefined,
      billingMonth: filterMonth || undefined,
      billingYear: filterYear || undefined,
    },
  });

  const invoices = invoiceData?.invoices || [];
  const totalPages = invoiceData?.meta?.totalPages || 1;
  const totalRowCount = invoiceData?.meta?.totalRowCount || 0;

  const createMutation = useCreateInvoice({
    onSuccess(res) {
      if (res?.statusCode === 200 || res?.statusCode === 201) {
        toast.success(res.message || "Tạo hóa đơn thành công");
        queryClient.invalidateQueries({ queryKey: [QK_INVOICES] });
        window.dispatchEvent(new Event("notifications-updated"));
        setElectricOld(electricNew);
        setWaterOld(waterNew);
      } else {
        toast.error(res?.message || "Không thể tạo hóa đơn");
      }
    },
  });

  const payMutation = usePayInvoice({
    onSuccess(res) {
      if (res?.statusCode === 200) {
        toast.success(res.message || "Đã xác nhận thanh toán");
        queryClient.invalidateQueries({ queryKey: [QK_INVOICES] });
        window.dispatchEvent(new Event("notifications-updated"));
      } else {
        toast.error(res?.message || "Không thể cập nhật trạng thái thanh toán");
      }
    },
  });

  const cancelMutation = useCancelInvoice({
    onSuccess(res) {
      if (res?.statusCode === 200) {
        toast.success(res.message || "Đã hủy hóa đơn");
        setCancelTarget(null);
        queryClient.invalidateQueries({ queryKey: [QK_INVOICES] });
        window.dispatchEvent(new Event("notifications-updated"));
      } else {
        toast.error(res?.message || "Không thể hủy hóa đơn");
      }
    },
  });

  const handleSelectContract = async (selectedId: string) => {
    setContractId(selectedId);
    setMeterHint("");
    if (!selectedId) return;
    try {
      const latest = await fetchLatestMeter(selectedId);
      if (latest) {
        setElectricOld(latest.electricOld);
        setElectricNew(latest.electricOld);
        setWaterOld(latest.waterOld);
        setWaterNew(latest.waterOld);
        setElectricRate(latest.electricRate || 3000);
        setWaterRate(latest.waterRate || 10000);
        if (latest.lastBillingMonth && latest.lastBillingYear) {
          setMeterHint(
            `Đã tự động lấy chỉ số cũ từ kỳ ${latest.lastBillingMonth}/${latest.lastBillingYear} (Điện: ${latest.electricOld}, Nước: ${latest.waterOld}).`
          );
        } else {
          setMeterHint("Hợp đồng chưa có hóa đơn trước đó, chỉ số cũ mặc định là 0.");
        }
      }
    } catch {
      // ignore suggestion fetch error
    }
  };

  const handleCreateInvoice = () => {
    if (!contractId) {
      toast.error("Vui lòng chọn hợp đồng đang hiệu lực");
      return;
    }
    if (billingMonth < 1 || billingMonth > 12) {
      toast.error("Tháng hóa đơn phải từ 1 đến 12");
      return;
    }
    if (billingYear < 2000 || billingYear > 2100) {
      toast.error("Năm hóa đơn không hợp lệ");
      return;
    }
    if (electricOld < 0 || electricNew < 0 || waterOld < 0 || waterNew < 0) {
      toast.error("Chỉ số điện nước không được âm");
      return;
    }
    if (electricRate < 0 || waterRate < 0) {
      toast.error("Đơn giá điện nước không được âm");
      return;
    }
    if (electricNew < electricOld) {
      toast.error("Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ");
      return;
    }
    if (waterNew < waterOld) {
      toast.error("Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ");
      return;
    }

    createMutation.mutate({
      contractId,
      billingMonth,
      billingYear,
      electricOld,
      electricNew,
      waterOld,
      waterNew,
      electricRate,
      waterRate,
      dueDate: dueDate || undefined,
    });
  };

  const selectedContract = activeContracts.find((c) => c.id === contractId);
  const electricUsage = Math.max(0, electricNew - electricOld);
  const waterUsage = Math.max(0, waterNew - waterOld);
  const electricAmount = electricUsage * electricRate;
  const waterAmount = waterUsage * waterRate;
  const roomAmount = selectedContract?.retailPrice || 0;
  const totalAmount = roomAmount + electricAmount + waterAmount;

  const summary = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => {
        if (inv.status === "PAID") acc.paid += inv.amount || 0;
        if (inv.status === "UNPAID") acc.unpaid += inv.amount || 0;
        return acc;
      },
      { paid: 0, unpaid: 0 }
    );
  }, [invoices]);

  return (
    <>
      <PageHeader>Quản lý hóa đơn điện nước</PageHeader>

      {isStaffOrManager && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <ReceiptLongIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Lập phiếu hóa đơn theo tháng
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Hợp đồng đang hiệu lực (ACTIVE)"
                  value={contractId}
                  onChange={(e) => handleSelectContract(e.target.value)}
                  fullWidth
                  helperText={
                    activeContracts.length === 0
                      ? "Hiện chưa có hợp đồng nào đang ở trạng thái ACTIVE"
                      : "Chọn hợp đồng để tự động lấy giá phòng & chỉ số kỳ trước"
                  }
                >
                  {activeContracts.map((contract) => (
                    <MenuItem key={contract.id} value={contract.id}>
                      {contract.customer?.fullName} — {contract.apartment?.address} (
                      {formatMoney(contract.retailPrice)}/tháng)
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Tháng"
                  type="number"
                  inputProps={{ min: 1, max: 12 }}
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Năm"
                  type="number"
                  inputProps={{ min: 2000, max: 2100 }}
                  value={billingYear}
                  onChange={(e) => setBillingYear(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  label="Hạn thanh toán"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>

            {meterHint && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {meterHint}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Chỉ số điện cũ (kWh)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={electricOld}
                  onChange={(e) => setElectricOld(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Chỉ số điện mới (kWh)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={electricNew}
                  error={electricNew < electricOld}
                  helperText={electricNew < electricOld ? "Điện mới phải >= điện cũ" : `Tiêu thụ: ${electricUsage} kWh`}
                  onChange={(e) => setElectricNew(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Đơn giá điện (VNĐ/kWh)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={electricRate}
                  onChange={(e) => setElectricRate(Number(e.target.value))}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Chỉ số nước cũ (m³)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={waterOld}
                  onChange={(e) => setWaterOld(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Chỉ số nước mới (m³)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={waterNew}
                  error={waterNew < waterOld}
                  helperText={waterNew < waterOld ? "Nước mới phải >= nước cũ" : `Tiêu thụ: ${waterUsage} m³`}
                  onChange={(e) => setWaterNew(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Đơn giá nước (VNĐ/m³)"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={waterRate}
                  onChange={(e) => setWaterRate(Number(e.target.value))}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Paper
              variant="outlined"
              sx={{ mt: 2.5, p: 2, bgcolor: "rgba(83, 0, 0, 0.03)", borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1.5}
              >
                <Typography variant="body2">
                  Tiền phòng: <b>{formatMoney(roomAmount)}</b> | Tiền điện ({electricUsage} kWh):{" "}
                  <b>{formatMoney(electricAmount)}</b> | Tiền nước ({waterUsage} m³):{" "}
                  <b>{formatMoney(waterAmount)}</b>
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={700}>
                  Tổng cộng: {formatMoney(totalAmount)}
                </Typography>
              </Stack>
            </Paper>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                variant="contained"
                disableElevation
                disabled={createMutation.isPending || !contractId}
                onClick={handleCreateInvoice}
              >
                {createMutation.isPending ? "Đang tạo hóa đơn..." : "Tạo phiếu hóa đơn & Gửi thông báo"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Filter & Summary Bar */}
      <Card sx={{ mb: 2.5, borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
              <TextField
                select
                size="small"
                label="Trạng thái"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as InvoiceStatus | "");
                  setPage(0);
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Tất cả trạng thái</MenuItem>
                <MenuItem value="UNPAID">Chưa thanh toán</MenuItem>
                <MenuItem value="PAID">Đã thanh toán</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Tháng"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value === "" ? "" : Number(e.target.value));
                  setPage(0);
                }}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
                  <MenuItem key={m} value={m}>
                    Tháng {m}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Năm"
                type="number"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value === "" ? "" : Number(e.target.value));
                  setPage(0);
                }}
                sx={{ width: 110 }}
              />

              <Button
                size="small"
                onClick={() => {
                  setFilterStatus("");
                  setFilterMonth("");
                  setFilterYear("");
                  setPage(0);
                }}
              >
                Xóa lọc
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => refetchInvoices()}
              >
                Làm mới
              </Button>
            </Stack>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip label={`Tổng phiếu: ${totalRowCount}`} variant="outlined" />
              <Chip label={`Đã thu (trang): ${formatMoney(summary.paid)}`} color="success" variant="outlined" />
              <Chip label={`Chưa thu (trang): ${formatMoney(summary.unpaid)}`} color="warning" variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {isInvoicesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : invoices.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography color="text.secondary">Chưa có phiếu hóa đơn nào phù hợp với bộ lọc.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {invoices.map((invoice) => {
            const statusMeta = INVOICE_STATUS_META[invoice.status] || {
              label: invoice.status,
              color: "default" as const,
            };
            const isOverdue =
              invoice.status === "UNPAID" &&
              invoice.dueDate &&
              dayjs(invoice.dueDate).isBefore(dayjs(), "day");

            return (
              <Card key={invoice.id} sx={{ borderRadius: 3, boxShadow: 1 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    gap={2}
                  >
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.75}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {invoice.invoiceNumber}
                        </Typography>
                        <Chip
                          size="small"
                          label={`Kỳ ${invoice.billingMonth}/${invoice.billingYear}`}
                          variant="outlined"
                        />
                        <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                        {isOverdue && <Chip size="small" label="Quá hạn" color="error" />}
                      </Stack>

                      <Typography variant="body2" fontWeight={600} color="text.primary" gutterBottom>
                        Phòng: {invoice.apartmentAddress || "—"} | Khách thuê:{" "}
                        {invoice.customerName || "—"}
                        {invoice.customerPhone ? ` (${invoice.customerPhone})` : ""}
                      </Typography>

                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Tiền phòng: <b>{formatMoney(invoice.roomAmount)}</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Điện ({invoice.electricOld} → {invoice.electricNew} = {invoice.electricUsage}{" "}
                            kWh): <b>{formatMoney(invoice.electricAmount)}</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Nước ({invoice.waterOld} → {invoice.waterNew} = {invoice.waterUsage} m³):{" "}
                            <b>{formatMoney(invoice.waterAmount)}</b>
                          </Typography>
                        </Grid>
                      </Grid>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Ngày lập: {invoice.issueDate} | Hạn thanh toán: {invoice.dueDate}
                        {invoice.paidAt
                          ? ` | Thanh toán lúc: ${new Date(invoice.paidAt).toLocaleString("vi-VN")}`
                          : ""}
                      </Typography>
                    </Box>

                    <Stack
                      alignItems={{ xs: "flex-start", md: "flex-end" }}
                      justifyContent="space-between"
                      spacing={1.5}
                      minWidth={220}
                    >
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        {formatMoney(invoice.amount)}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<PrintIcon />}
                          onClick={() => setDetailInvoice(invoice)}
                        >
                          Xem phiếu
                        </Button>
                        {invoice.status === "UNPAID" && isStaffOrManager && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disableElevation
                              startIcon={<CheckCircleOutlineIcon />}
                              disabled={payMutation.isPending}
                              onClick={() => payMutation.mutate({ id: invoice.id })}
                            >
                              Đã thanh toán
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelOutlinedIcon />}
                              disabled={cancelMutation.isPending}
                              onClick={() => setCancelTarget(invoice)}
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
          />
        </Stack>
      )}

      {/* Invoice Receipt Preview / Print Dialog */}
      <Dialog
        open={!!detailInvoice}
        onClose={() => setDetailInvoice(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          PHIẾU BÁO TIỀN PHÒNG & ĐIỆN NƯỚC
        </DialogTitle>
        <DialogContent dividers>
          {detailInvoice && (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  <b>Mã hóa đơn:</b> {detailInvoice.invoiceNumber}
                </Typography>
                <Chip
                  size="small"
                  label={INVOICE_STATUS_META[detailInvoice.status]?.label || detailInvoice.status}
                  color={INVOICE_STATUS_META[detailInvoice.status]?.color || "default"}
                />
              </Stack>
              <Typography variant="body2">
                <b>Kỳ thanh toán:</b> Tháng {detailInvoice.billingMonth}/{detailInvoice.billingYear}
              </Typography>
              <Typography variant="body2">
                <b>Phòng trọ:</b> {detailInvoice.apartmentAddress || "—"}
              </Typography>
              <Typography variant="body2">
                <b>Khách thuê:</b> {detailInvoice.customerName || "—"}
                {detailInvoice.customerPhone ? ` — SĐT: ${detailInvoice.customerPhone}` : ""}
              </Typography>
              <Typography variant="body2">
                <b>Ngày lập:</b> {detailInvoice.issueDate} | <b>Hạn thanh toán:</b>{" "}
                {detailInvoice.dueDate}
              </Typography>

              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Khoản mục</b></TableCell>
                    <TableCell align="right"><b>Chi tiết</b></TableCell>
                    <TableCell align="right"><b>Thành tiền</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Tiền thuê phòng</TableCell>
                    <TableCell align="right">1 tháng</TableCell>
                    <TableCell align="right">{formatMoney(detailInvoice.roomAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tiền điện</TableCell>
                    <TableCell align="right">
                      {detailInvoice.electricOld} → {detailInvoice.electricNew} ({detailInvoice.electricUsage} kWh ×{" "}
                      {formatMoney(detailInvoice.electricRate)})
                    </TableCell>
                    <TableCell align="right">{formatMoney(detailInvoice.electricAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tiền nước</TableCell>
                    <TableCell align="right">
                      {detailInvoice.waterOld} → {detailInvoice.waterNew} ({detailInvoice.waterUsage} m³ ×{" "}
                      {formatMoney(detailInvoice.waterRate)})
                    </TableCell>
                    <TableCell align="right">{formatMoney(detailInvoice.waterAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography fontWeight={700}>TỔNG CỘNG THANH TOÁN</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700} color="primary">
                        {formatMoney(detailInvoice.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {detailInvoice.paidAt && (
                <Alert severity="success">
                  Đã thanh toán vào lúc: {new Date(detailInvoice.paidAt).toLocaleString("vi-VN")}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailInvoice(null)}>Đóng</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            In phiếu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => !cancelMutation.isPending && setCancelTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xác nhận hủy hóa đơn?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Bạn có chắc chắn muốn hủy hóa đơn <b>{cancelTarget?.invoiceNumber}</b> (kỳ{" "}
            {cancelTarget?.billingMonth}/{cancelTarget?.billingYear}) không? Thao tác này không thể
            hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={cancelMutation.isPending}>
            Đóng
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending || !cancelTarget}
            onClick={() => cancelTarget && cancelMutation.mutate({ id: cancelTarget.id })}
          >
            {cancelMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoicePage;
