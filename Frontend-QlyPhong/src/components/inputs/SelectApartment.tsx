import {
  CircularProgress,
  AutocompleteProps,
  Autocomplete,
  AutocompleteRenderInputParams,
  TextField,
} from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import { forwardRef } from "react";
import { Api } from "../../api";
import { ApiRoutes, QK_APARTMENTS } from "../../constants";
import { formatCurrency } from "../../utils/stringFormats";

const __loadingText = (
  <>
    <CircularProgress size={16} sx={{ mr: 1 }} />
    Đang tải...
  </>
);

export type ApartmentOption = {
  value: string;
  label: string;
  retailPrice: number;
  address: string;
};

type ApartmentPageReturns = {
  data: Apartment[];
  currentPage: number;
  nextPage: number | null;
};

const fetchApartments = ({
  pageParam = 0,
  available,
}: {
  pageParam?: number;
  available?: boolean;
}): Promise<ApartmentPageReturns> =>
  Api.instance
    .get<ApiResponse<ApartmentApiResponse>>(ApiRoutes.apartment.GetAll, {
      params: { page: pageParam, pageSize: 50, ...(available !== undefined ? { available } : {}) },
    })
    .then((res) => {
      const value = res.data.data;
      return {
        data: value?.apartments || [],
        currentPage: value?.page?.pageNumber ?? 0,
        nextPage: value?.page?.last ? null : (value?.page?.pageNumber ?? 0) + 1,
      };
    });

type SelectApartmentProps = Omit<
  AutocompleteProps<ApartmentOption, false, false, false>,
  "options" | "renderInput"
> & {
  onlyAvailable?: boolean;
  error?: boolean;
};

const SelectApartment = forwardRef(({ onlyAvailable = true, error, ...props }: SelectApartmentProps, ref) => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: [QK_APARTMENTS, onlyAvailable ? "available" : "all"],
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      fetchApartments({ pageParam, available: onlyAvailable ? true : undefined }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (res) =>
      res?.pages.flatMap((page) =>
        page.data.map((item) => ({
          value: item.id,
          label: `${item.address} (${item.numberOfRoom} phòng - ${formatCurrency(item.retailPrice)}/tháng)`,
          retailPrice: Number(item.retailPrice) || 0,
          address: item.address,
        }))
      ) || [],
  });

  return (
    <Autocomplete
      ref={ref}
      {...props}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params: AutocompleteRenderInputParams): React.ReactNode => (
        <TextField {...params} placeholder="Chọn phòng trọ..." error={error} />
      )}
      options={data || []}
      getOptionKey={(option) => option.value}
      loading={isLoading}
      loadingText={__loadingText}
      noOptionsText="Không có phòng trống phù hợp"
      ListboxProps={{
        onScroll: (e) => {
          const listboxNode = e.currentTarget;
          if (listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 4) {
            if (hasNextPage) fetchNextPage();
          }
        },
      }}
    />
  );
});

export default SelectApartment;
