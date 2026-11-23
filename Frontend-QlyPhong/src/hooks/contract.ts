import { createMutation, createQuery } from "react-query-kit";
import { ContractRoutes, QK_CONTRACTS } from "../constants";
import { keepPreviousData } from "@tanstack/react-query";
import { Api } from "../api";
import toast from "react-hot-toast";

type UseGetContractsHookReturns = {
  contracts: Contract[];
  meta: { totalRowCount: number };
};

type ContractQueryParams = ApiFetchParams & { q?: string };

export const useGetContracts = createQuery<UseGetContractsHookReturns, ContractQueryParams>({
  queryKey: [QK_CONTRACTS],
  fetcher: (variables: ContractQueryParams): Promise<UseGetContractsHookReturns> => {
    const { q, ...others } = variables;
    const trimmed = q?.trim();
    const request = trimmed
      ? Api.search<ContractApiResponse>(ContractRoutes.Search, { ...others, q: trimmed })
      : Api.fetch<ContractApiResponse>(ContractRoutes.GetAll, others);

    return request.then((value) => ({
      contracts: value?.contracts || [],
      meta: {
        totalRowCount: value?.page?.totalElements ?? 0,
      },
    }));
  },
  placeholderData: keepPreviousData,
});

export const useCreateContract = createMutation({
  mutationFn: async (variables: ContractDTO) => Api.create(ContractRoutes.Add, variables),
  onError(error) {
    toast.error(error?.message || "Không thể tạo hợp đồng mới");
  },
});

export const useUpdateContract = createMutation({
  mutationFn: async (variables: { data: ContractDTO; id: string }) =>
    Api.update<ContractDTO>(ContractRoutes.Update, variables),
  onError(error) {
    toast.error(error?.message || "Không thể cập nhật hợp đồng");
  },
});

export const useDeleteContract = createMutation({
  mutationFn: async (variables: { id: string }) => Api.delete(ContractRoutes.Delete, variables),
  onError(error) {
    toast.error(error?.message || "Không thể xóa hợp đồng");
  },
});

export const useTerminateContract = createMutation({
  mutationFn: async (variables: { id: string; data: { terminatedAt: string; reason: string } }) =>
    Api.instance
      .post<ApiResponse>(`${ContractRoutes.Terminate}/${variables.id}`, variables.data)
      .then((response) => response.data),
  onError(error) {
    toast.error(error?.message || "Không thể thanh lý hợp đồng");
  },
});
