import { createMutation, createQuery } from "react-query-kit";
import { keepPreviousData } from "@tanstack/react-query";
import { Api } from "../api";
import { InvoiceRoutes, QK_INVOICES } from "../constants";
import toast from "react-hot-toast";

type UseGetInvoicesReturns = {
  invoices: Invoice[];
  meta: {
    totalRowCount: number;
    totalPages: number;
    pageNumber: number;
  };
};

export const useGetInvoices = createQuery<UseGetInvoicesReturns, InvoiceFilterParams>({
  queryKey: [QK_INVOICES],
  fetcher: async (variables: InvoiceFilterParams) => {
    const params: Record<string, string | number> = {
      page: variables.page ?? 0,
      pageSize: variables.pageSize ?? 20,
    };
    if (variables.status) params.status = variables.status;
    if (variables.billingMonth) params.billingMonth = variables.billingMonth;
    if (variables.billingYear) params.billingYear = variables.billingYear;
    if (variables.contractId) params.contractId = variables.contractId;

    const response = await Api.instance.get<ApiResponse<InvoiceApiResponse>>(InvoiceRoutes.GetAll, {
      params,
    });
    const data = response.data?.data;
    return {
      invoices: data?.invoices || [],
      meta: {
        totalRowCount: data?.page?.totalElements ?? 0,
        totalPages: data?.page?.totalPages ?? 1,
        pageNumber: data?.page?.pageNumber ?? 0,
      },
    };
  },
  placeholderData: keepPreviousData,
});

export const useCreateInvoice = createMutation({
  mutationFn: async (variables: InvoiceCreateDTO) =>
    Api.instance.post<ApiResponse<Invoice>>(InvoiceRoutes.Create, variables).then((res) => res.data),
  onError(error) {
    toast.error(error?.message || "Không thể tạo hóa đơn");
  },
});

export const usePayInvoice = createMutation({
  mutationFn: async (variables: { id: string }) =>
    Api.instance
      .post<ApiResponse<Invoice>>(`${InvoiceRoutes.Pay}/${variables.id}/pay`)
      .then((res) => res.data),
  onError(error) {
    toast.error(error?.message || "Không thể xác nhận thanh toán");
  },
});

export const useCancelInvoice = createMutation({
  mutationFn: async (variables: { id: string }) =>
    Api.instance
      .post<ApiResponse<Invoice>>(`${InvoiceRoutes.Cancel}/${variables.id}/cancel`)
      .then((res) => res.data),
  onError(error) {
    toast.error(error?.message || "Không thể hủy hóa đơn");
  },
});

export const fetchLatestMeter = async (contractId: string): Promise<LatestMeterReading | null> => {
  if (!contractId) return null;
  const response = await Api.instance.get<ApiResponse<LatestMeterReading>>(
    InvoiceRoutes.LatestMeter,
    { params: { contractId } }
  );
  if (response.data?.statusCode === 200) {
    return response.data.data;
  }
  return null;
};
