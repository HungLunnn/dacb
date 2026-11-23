type TPagination = {
  pageNumber: number;
  pageSize: number;
  offset: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
  sorted: boolean;
  first: boolean;
  last: boolean;
  empty: boolean;
};

type User = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  createDate: string;
  active: boolean;
  role: string;
  phoneNumber?: string;
};

// type Customer = {
//   id: string;
//   status: ECustomerStatus;
//   firstName: string;
//   lastName: string;
//   address: string;
//   age: number;
// };

type Customer = {
  id: string;
  address: string;
  fullName: string;
  citizenId: string;
  dob: string;
  phoneNumber: string;
};

type ArrayDate = [number, number, number];

type Contract = {
  id: string;
  startDate: string;
  endDate: string;
  createDate?: string;
  retailPrice: number;
  total: number;
  status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  terminatedAt?: string;
  terminationReason?: string;
  customer: Customer;
  apartment: Apartment;
  user: User;
};

type Apartment = {
  id: string;
  address: string;
  numberOfRoom: number;
  retailPrice: number;
  status: boolean;
};
/**
 * Contract View Model for UI to consume
 */
type ContractVM = {
  id: string;
  endDate: string;
  startDate: string;
  customerName: string;
  apartmentId: string;
  apartmentAddress: string;
};

type UserVM = Pick<User, "id" | "email" | "createDate" | "role" | "username" | "active">;

type ApiExportParams = {
  getTemplate: false;
};

// For CREATE
type ContractDTO = {
  apartmentId: string;
  customerId: string;
  endDate: string;
  startDate: string;
  userId: string;
};

type ContractResponseDTO = {
  apartmentId: string;
  createDate: string;
  customerId: string;
  endDate: string;
  id: string;
  retailPrice: number;
  startDate: string;
  total: number;
  status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED";
  terminatedAt?: string;
  terminationReason?: string;
  userId: string;
};

type UserUpdateDTO = Pick<User, "email" | "role" | "active" | "fullName" | "phoneNumber"> & { phoneNumber: string };
type UserCreateDTO = Omit<UserUpdateDTO, "active"> & Pick<User, "username">;
type ApartmentUpdateDTO = Omit<Apartment, "id">;
type CustomerUpdateDTO = Omit<Customer, "id">;
type ChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};
type TApiUpdateDTO =
  | ApartmentUpdateDTO
  | ContractDTO
  | CustomerUpdateDTO
  | UserCreateDTO
  | UserUpdateDTO
  | ChangePasswordDTO;

// For UPDATE, DELTE
type ApiUpdateParams<TData = TApiUpdateDTO> = {
  id: string;
  data: TData;
};

type ApiFetchParams = {
  page: 0 | number;
  pageSize: 10 | number;
  sortBy?: string;
};
/**
 * @param {q} string query
 */
type ApiSearchParams = ApiFetchParams & { q: string };

// LOGIN
type ApiLoginParams = {
  username: string;
  password: string;
};

type ApartmentApiResponse = {
  apartments: Apartment[];
  page: TPagination;
};

type ContractApiResponse = {
  page: TPagination;
  contracts: Contract[];
};

type CustomerApiResponse = {
  page: TPagination;
  customers: Customer[];
};

type UserApiResponse = {
  page: TPagination;
  users: User[];
};

type ImportResponseData = {
  "The rows failed": string;
  "Number of successful rows": number;
  File: string; // file name
};

type ImportResponse = ImportResponseData[];

type TokenPayloadData = {
  role: string;
  iss: string; //issuer
  iat: number | string; //issuedAt
  exp: number | string;
};

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

type ApiQueryStatus = {
  message: string;
  statusCode: number;
};

type ApiResponseData =
  | ApartmentApiResponse
  | ContractApiResponse
  | CustomerApiResponse
  | ImportResponse
  | AuthTokens
  | UserApiResponse;

type ApiResponse<TData = ApiResponseData> = ApiQueryStatus & {
  data: TData;
};

type ContractInputs = Omit<ContractDTO, "endDate" | "startDate" | "userId"> & {
  endDate: Date;
  startDate: Date;
};

type InvoiceStatus = "UNPAID" | "PAID" | "CANCELLED";

type Invoice = {
  id: string;
  invoiceNumber: string;
  contractId: string;
  customerName?: string;
  customerPhone?: string;
  apartmentAddress?: string;
  contractStatus?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAt?: string | null;
  createdAt?: string | null;
  billingMonth: number;
  billingYear: number;
  roomAmount: number;
  electricOld: number;
  electricNew: number;
  electricUsage: number;
  electricRate: number;
  electricAmount: number;
  waterOld: number;
  waterNew: number;
  waterUsage: number;
  waterRate: number;
  waterAmount: number;
};

type InvoiceCreateDTO = {
  contractId: string;
  billingMonth: number;
  billingYear: number;
  electricOld: number;
  electricNew: number;
  waterOld: number;
  waterNew: number;
  electricRate: number;
  waterRate: number;
  dueDate?: string;
};

type InvoiceApiResponse = {
  page: TPagination;
  invoices: Invoice[];
};

type LatestMeterReading = {
  contractId: string;
  roomAmount: number;
  electricOld: number;
  waterOld: number;
  electricRate: number;
  waterRate: number;
  lastBillingMonth?: number | null;
  lastBillingYear?: number | null;
};

type InvoiceFilterParams = {
  page?: number;
  pageSize?: number;
  status?: InvoiceStatus | "";
  billingMonth?: number | "";
  billingYear?: number | "";
  contractId?: string;
};
