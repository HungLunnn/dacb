package com.example.demo.service.implement;

import com.example.demo.entity.Apartment;
import com.example.demo.entity.Contract;
import com.example.demo.entity.Customer;
import com.example.demo.entity.User;
import com.example.demo.enumuration.EContractStatus;
import com.example.demo.enumuration.EInvoiceStatus;
import com.example.demo.enumuration.ENotificationType;
import com.example.demo.enumuration.ERole;
import com.example.demo.exception.*;
import com.example.demo.helper.CsvHelper;
import com.example.demo.message.AuthMessage;
import com.example.demo.message.ContractMessage;
import com.example.demo.message.FileMessage;
import com.example.demo.message.GlobalMessage;
import com.example.demo.model.DTO.contract.ContractDTO;
import com.example.demo.model.DTO.contract.ContractResponse;
import com.example.demo.model.DTO.contract.ContractTerminateDTO;
import com.example.demo.model.DTO.contract.ContractUpdateDTO;
import com.example.demo.model.DTO.paging.APIPageableDTO;
import com.example.demo.model.mapper.EntityToDto;
import com.example.demo.repository.ApartmentRepository;
import com.example.demo.repository.ContractRepository;
import com.example.demo.repository.InvoiceRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.interfaces.ApartmentService;
import com.example.demo.service.interfaces.ContractService;
import com.example.demo.service.interfaces.CustomerService;
import com.example.demo.service.interfaces.NotificationService;
import com.example.demo.service.interfaces.UserService;
import com.example.demo.util.JwtUtil;
import com.example.demo.util.MyUtils;
import com.example.demo.util.validator.ContractValidator;
import com.example.demo.util.validator.FileValidator;
import io.jsonwebtoken.JwtException;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@AllArgsConstructor
@Log4j2
public class ContractServiceImpl implements ContractService {
    private final ContractRepository contractRepository;
    private final ApartmentRepository apartmentRepository;
    private final CustomerService customerService;
    private final ApartmentService apartmentService;
    private final UserService userService;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void syncApartmentStatus(Apartment apartment) {
        if (apartment == null || apartment.getId() == null) return;
        boolean hasActive = contractRepository.existsByApartment_IdAndStatus(apartment.getId(), EContractStatus.ACTIVE);
        if (apartment.isStatus() != hasActive) {
            apartment.setStatus(hasActive);
            apartmentRepository.save(apartment);
        }
    }

    private void syncContractStatuses() {
        LocalDate today = LocalDate.now();
        Set<Apartment> affectedApartments = new LinkedHashSet<>();

        List<Contract> expiredContracts = contractRepository.findAllByStatusInAndEndDateBefore(
                List.of(EContractStatus.ACTIVE, EContractStatus.DRAFT), today);
        if (!expiredContracts.isEmpty()) {
            for (Contract c : expiredContracts) {
                c.setStatus(EContractStatus.EXPIRED);
                if (c.getApartment() != null) affectedApartments.add(c.getApartment());
            }
            contractRepository.saveAll(expiredContracts);
        }

        List<Contract> activatedContracts = contractRepository.findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                EContractStatus.DRAFT, today, today);
        if (!activatedContracts.isEmpty()) {
            for (Contract c : activatedContracts) {
                c.setStatus(EContractStatus.ACTIVE);
                if (c.getApartment() != null) affectedApartments.add(c.getApartment());
            }
            contractRepository.saveAll(activatedContracts);
        }

        for (Apartment apt : affectedApartments) {
            syncApartmentStatus(apt);
        }
    }

    private EContractStatus resolveStatusForDates(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (endDate.isBefore(today)) {
            return EContractStatus.EXPIRED;
        }
        if (startDate.isAfter(today)) {
            return EContractStatus.DRAFT;
        }
        return EContractStatus.ACTIVE;
    }

    @Override
    @Transactional
    public Map<String, Object> getAll(Pageable pageable) throws NoContentException {
        syncContractStatuses();
        Map<String, Object> result = new HashMap<>();

        Page<Contract> pageEntity = contractRepository.findAll(pageable);
        Page<ContractResponse> pageResponse = pageEntity.map(EntityToDto::ContractToResponse);

        APIPageableDTO apiPageableDTO = new APIPageableDTO(pageResponse);

        result.put("page", apiPageableDTO);
        result.put("contracts", pageResponse.getContent());

        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> getAllByUser(Pageable pageable, String username) throws NoContentException {
        syncContractStatuses();
        Map<String, Object> result = new HashMap<>();

        String phone = userRepository.findUserByUsername(username)
                .map(u -> normalizePhone(u.getPhoneNumber()))
                .orElse(null);

        Page<Contract> pageEntity = contractRepository.findAllForUserByUsernameOrPhone(username, phone, pageable);
        Page<ContractResponse> pageResponse = pageEntity.map(EntityToDto::ContractToResponse);

        APIPageableDTO apiPageableDTO = new APIPageableDTO(pageResponse);

        result.put("page", apiPageableDTO);
        result.put("contracts", pageResponse.getContent());

        return result;
    }

    private Contract getContract(String id) throws NotFoundException {
        return contractRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ContractMessage.NOT_FOUND));
    }

    @Override
    public ContractDTO getContractDTO(String id) {
        Contract contractFromDB = getContract(id);
        return EntityToDto.contractToDto(contractFromDB);
    }

    @Override
    public ContractDTO getContractDTOForUser(String id, String username) {
        Contract contractFromDB = getContract(id);

        String userPhone = userRepository.findUserByUsername(username)
                .map(u -> normalizePhone(u.getPhoneNumber()))
                .orElse(null);
        String customerPhone = contractFromDB.getCustomer() == null ? null : normalizePhone(contractFromDB.getCustomer().getPhoneNumber());

        boolean ownedByUser = contractFromDB.getUser() != null && contractFromDB.getUser().getUsername().equals(username);
        boolean matchedByPhone = userPhone != null && userPhone.equals(customerPhone);

        if (!ownedByUser && !matchedByPhone) {
            throw new ForbiddenException();
        }

        return EntityToDto.contractToDto(contractFromDB);
    }

    @Override
    @Transactional
    public ContractDTO create(ContractDTO contractDTO) {
        return create(contractDTO, null);
    }

    @Override
    @Transactional
    public ContractDTO create(ContractDTO contractDTO, String token) {
        syncContractStatuses();

        if ((contractDTO.getUserId() == null || contractDTO.getUserId().trim().isEmpty()) && token != null) {
            String username = JwtUtil.extractUsername(token);
            User currentUser = userService.getUserByUsername(username);
            contractDTO.setUserId(currentUser.getId());
        }

        ContractValidator.validatorContractDTO(contractDTO);

        LocalDate startDate = LocalDate.parse(contractDTO.getStartDate());
        LocalDate endDate = LocalDate.parse(contractDTO.getEndDate());
        if (endDate.isBefore(LocalDate.now())) {
            throw new InValidException("Ngày kết thúc hợp đồng không được nằm trong quá khứ");
        }

        checkApartmentInUsing(contractDTO);

        Customer customerFromDB = customerService.getCustomer(contractDTO.getCustomerId());
        Apartment apartmentFromDB = apartmentService.getApartment(contractDTO.getApartmentId());
        User userFromDB = userService.getUserById(contractDTO.getUserId());

        EContractStatus initialStatus = resolveStatusForDates(startDate, endDate);

        Contract contractToCreate = Contract.builder()
                .startDate(startDate)
                .endDate(endDate)
                .total(calculateTotal(startDate, endDate, apartmentFromDB))
                .retailPrice(apartmentFromDB.getRetailPrice())
                .customer(customerFromDB)
                .apartment(apartmentFromDB)
                .user(userFromDB)
                .status(initialStatus)
                .build();

        Contract storedContract = contractRepository.save(contractToCreate);
        syncApartmentStatus(apartmentFromDB);

        notificationService.notifyContractOrInvoiceEvent(
                storedContract,
                "Hợp đồng mới",
                "Hợp đồng thuê " + apartmentFromDB.getAddress()
                        + " (" + startDate + " đến " + endDate + ") đã được tạo.",
                ENotificationType.CONTRACT_CREATED
        );

        return EntityToDto.contractToDto(storedContract);
    }

    @Override
    @Transactional
    public ContractDTO update(String id, ContractUpdateDTO contractUpdate, String token) throws JwtException, ForbiddenException {
        if (JwtUtil.isAccessTokenExpired(token)) {
            throw new JwtException(AuthMessage.TOKEN_EXPIRED);
        }

        String role = JwtUtil.extractRole(token);
        if (!ERole.MANAGER.toString().equals(role) && !ERole.STAFF.toString().equals(role)) {
            throw new ForbiddenException();
        }

        syncContractStatuses();
        Contract storedContract = getContract(id);

        if (storedContract.getStatus() == EContractStatus.TERMINATED) {
            throw new InValidException("Không thể chỉnh sửa hợp đồng đã thanh lý");
        }

        ContractValidator.validatorContactUpdateDTO(contractUpdate);

        Customer targetCustomer = contractUpdate.getCustomerId() != null
                ? customerService.getCustomer(contractUpdate.getCustomerId())
                : storedContract.getCustomer();
        Apartment oldApartment = storedContract.getApartment();
        Apartment targetApartment = contractUpdate.getApartmentId() != null
                ? apartmentService.getApartment(contractUpdate.getApartmentId())
                : storedContract.getApartment();
        LocalDate targetStartDate = contractUpdate.getStartDate() != null
                ? MyUtils.stringToDate(contractUpdate.getStartDate())
                : storedContract.getStartDate();
        LocalDate targetEndDate = contractUpdate.getEndDate() != null
                ? MyUtils.stringToDate(contractUpdate.getEndDate())
                : storedContract.getEndDate();

        ContractValidator.invalidStartDateAndEndDate(targetStartDate, targetEndDate);

        ContractDTO checkDto = ContractDTO.builder()
                .id(storedContract.getId())
                .apartmentId(targetApartment.getId())
                .customerId(targetCustomer.getId())
                .startDate(targetStartDate.toString())
                .endDate(targetEndDate.toString())
                .build();
        checkApartmentInUsing(checkDto);

        storedContract.setStartDate(targetStartDate);
        storedContract.setEndDate(targetEndDate);
        storedContract.setCustomer(targetCustomer);
        storedContract.setApartment(targetApartment);
        storedContract.setTotal(calculateTotal(targetStartDate, targetEndDate, targetApartment));
        storedContract.setRetailPrice(targetApartment.getRetailPrice());
        storedContract.setStatus(resolveStatusForDates(targetStartDate, targetEndDate));

        Contract updatedContract = contractRepository.save(storedContract);

        syncApartmentStatus(targetApartment);
        if (oldApartment != null && !oldApartment.getId().equals(targetApartment.getId())) {
            syncApartmentStatus(oldApartment);
        }

        notificationService.notifyContractOrInvoiceEvent(
                updatedContract,
                "Hợp đồng được cập nhật",
                "Hợp đồng thuê " + updatedContract.getApartment().getAddress()
                        + " (" + updatedContract.getStartDate() + " đến " + updatedContract.getEndDate()
                        + ") đã được cập nhật.",
                ENotificationType.CONTRACT_UPDATED
        );

        return EntityToDto.contractToDto(updatedContract);
    }

    @Override
    @Transactional
    public ContractDTO delete(String id) throws NotFoundException, InValidException {
        syncContractStatuses();
        Contract contract = getContract(id);

        if (contract.getStatus() == EContractStatus.ACTIVE) {
            throw new InValidException("Không thể xóa hợp đồng đang còn hiệu lực. Vui lòng thanh lý trước hạn.");
        }
        if (invoiceRepository.existsByContract_Id(id)) {
            throw new InValidException("Không thể xóa hợp đồng đã phát sinh hóa đơn");
        }

        Apartment apartment = contract.getApartment();
        ContractDTO dto = EntityToDto.contractToDto(contract);
        contractRepository.delete(contract);
        syncApartmentStatus(apartment);

        return dto;
    }

    public Map<String, Object> loadContract(MultipartFile file) {
        FileValidator.validatorMultipartFile(file);

        if (!CsvHelper.hasCsvFormat(file)) throw new InValidException(FileMessage.MUST_TYPE_CSV);

        Map<String, Object> response = new HashMap<>();
        response.put("File", file.getOriginalFilename());

        List<ContractDTO> contractList = CsvHelper.csvToContracts(file);
        int numberOfContractAdded = 0;
        String failedRows = "";

        for (int i = 0; i < contractList.size(); i++) {
            try {
                ContractValidator.validatorContractDTO(contractList.get(i));
            } catch (Exception e) {
                failedRows = failedRows.concat((i + 1) + " , ");
                continue;
            }

            Customer customerFromDB;
            Apartment apartmentFromDB;

            try {
                apartmentFromDB = apartmentService.getApartment(contractList.get(i).getApartmentId());
            } catch (NotFoundException e) {
                failedRows = failedRows.concat((i + 1) + " , ");
                continue;
            }

            try {
                customerFromDB = customerService.getCustomer(contractList.get(i).getCustomerId());
            } catch (NotFoundException e) {
                failedRows = failedRows.concat((i + 1) + " , ");
                continue;
            }

            try {
                checkApartmentInUsing(contractList.get(i));
            } catch (Exception e) {
                failedRows = failedRows.concat((i + 1) + " , ");
                continue;
            }

            LocalDate startDate = MyUtils.stringToDate(contractList.get(i).getStartDate());
            LocalDate endDate = MyUtils.stringToDate(contractList.get(i).getEndDate());
            Contract contractToAdd = Contract.builder()
                    .startDate(startDate)
                    .endDate(endDate)
                    .total(calculateTotal(startDate, endDate, apartmentFromDB))
                    .retailPrice(apartmentFromDB.getRetailPrice())
                    .status(resolveStatusForDates(startDate, endDate))
                    .customer(customerFromDB)
                    .apartment(apartmentFromDB)
                    .build();

            contractRepository.save(contractToAdd);
            numberOfContractAdded++;
        }

        response.put(FileMessage.NUMBER_SUCCESS_ROW, numberOfContractAdded);

        if (!failedRows.isEmpty())
            failedRows = failedRows.substring(0, failedRows.length() - 3);
        response.put(FileMessage.FAILED_ROWS, failedRows);

        return response;
    }

    public List<Object> loadContracts(MultipartFile[] files) {
        List<Object> response = new ArrayList<>();
        for (MultipartFile file : files) {
            response.add(loadContract(file));
        }
        return response;
    }

    public void checkApartmentInUsing(ContractDTO contractToCheck) throws InValidException {
        List<Contract> contractListByApartmentId =
                contractRepository.getContractsByApartment_Id(contractToCheck.getApartmentId());

        LocalDate startDateOfNewContract = LocalDate.parse(contractToCheck.getStartDate());
        LocalDate endDateOfNewContract = LocalDate.parse(contractToCheck.getEndDate());

        for (Contract contract : contractListByApartmentId) {
            if (contractToCheck.getId() != null && contractToCheck.getId().equals(contract.getId()))
                continue;

            if (contract.getStatus() == EContractStatus.TERMINATED || contract.getStatus() == EContractStatus.EXPIRED) {
                continue;
            }

            if (!(endDateOfNewContract.isBefore(contract.getStartDate()) || startDateOfNewContract.isAfter(contract.getEndDate())))
                throw new InValidException(ContractMessage.APARTMENT_USING);
        }
    }

    public double calculateTotal(LocalDate startDate, LocalDate endDate, Apartment apartment) {
        return MyUtils.getMonthBetweenTwoLocalDate(startDate, endDate) * apartment.getRetailPrice();
    }

    @Override
    @Transactional
    public Map<String, Object> search(String query, Pageable pageable) {
        return search(query, pageable, null);
    }

    @Override
    @Transactional
    public Map<String, Object> search(String query, Pageable pageable, String token) {
        if (query == null || query.trim().isEmpty())
            throw new InValidException(GlobalMessage.NOT_NULL_QUERY);

        syncContractStatuses();
        Map<String, Object> result = new HashMap<>();
        String trimmedQuery = query.trim();

        Page<Contract> pageEntity;
        if (token != null && "USER".equals(JwtUtil.extractRole(token))) {
            String username = JwtUtil.extractUsername(token);
            String phone = userRepository.findUserByUsername(username)
                    .map(u -> normalizePhone(u.getPhoneNumber()))
                    .orElse(null);
            pageEntity = contractRepository.searchForUser(trimmedQuery, username, phone, pageable);
        } else {
            pageEntity = contractRepository.search(trimmedQuery, pageable);
        }

        Page<ContractResponse> pageResponse = pageEntity.map(EntityToDto::ContractToResponse);
        APIPageableDTO apiPageableDTO = new APIPageableDTO(pageResponse);

        result.put("page", apiPageableDTO);
        result.put("contracts", pageResponse.getContent());

        return result;
    }

    @Override
    public Map<String, Object> statistic(int nowYear) {
        Map<String, Object> res = new HashMap<>();

        long count = contractRepository.count();
        if (count == 0) return null;

        res.put("count", count);
        res.put("total_revenue", contractRepository.getTotalAmount());

        return res;
    }

    @Override
    @Transactional
    public ContractDTO terminate(String id, ContractTerminateDTO terminateDTO, String token)
            throws JwtException, ForbiddenException, InValidException, NotFoundException {
        if (JwtUtil.isAccessTokenExpired(token)) {
            throw new JwtException(AuthMessage.TOKEN_EXPIRED);
        }

        String role = JwtUtil.extractRole(token);
        if (!ERole.MANAGER.toString().equals(role) && !ERole.STAFF.toString().equals(role)) {
            throw new ForbiddenException();
        }

        syncContractStatuses();
        Contract contract = getContract(id);

        if (contract.getStatus() == EContractStatus.TERMINATED) {
            throw new InValidException("Hợp đồng này đã được thanh lý trước đó");
        }
        if (contract.getStatus() == EContractStatus.EXPIRED) {
            throw new InValidException("Hợp đồng đã hết hạn, không thể thanh lý trước hạn");
        }

        long unpaidInvoices = invoiceRepository.countByContract_IdAndStatus(contract.getId(), EInvoiceStatus.UNPAID);
        if (unpaidInvoices > 0) {
            throw new InValidException("Hợp đồng còn " + unpaidInvoices
                    + " hóa đơn chưa thanh toán. Vui lòng thanh toán hoặc hủy hóa đơn trước khi thanh lý.");
        }

        LocalDate terminatedAt;
        if (terminateDTO == null || terminateDTO.getTerminatedAt() == null || terminateDTO.getTerminatedAt().trim().isEmpty()) {
            terminatedAt = LocalDate.now();
        } else {
            try {
                terminatedAt = LocalDate.parse(terminateDTO.getTerminatedAt().trim());
            } catch (DateTimeParseException e) {
                throw new InValidException("Định dạng ngày thanh lý không hợp lệ (cần yyyy-MM-dd)");
            }
        }

        if (contract.getStatus() == EContractStatus.DRAFT) {
            if (terminatedAt.isAfter(contract.getEndDate())) {
                throw new InValidException("Ngày thanh lý không được lớn hơn ngày kết thúc hợp đồng");
            }
        } else {
            if (terminatedAt.isBefore(contract.getStartDate()) || terminatedAt.isAfter(contract.getEndDate())) {
                throw new InValidException("Ngày thanh lý phải nằm trong thời hạn hợp đồng ("
                        + contract.getStartDate() + " đến " + contract.getEndDate() + ")");
            }
        }

        String reason = terminateDTO == null || terminateDTO.getReason() == null
                ? null
                : terminateDTO.getReason().trim();

        contract.setStatus(EContractStatus.TERMINATED);
        contract.setTerminatedAt(terminatedAt);
        contract.setTerminationReason(reason == null || reason.isEmpty() ? null : reason);
        contractRepository.save(contract);

        syncApartmentStatus(contract.getApartment());

        String reasonSuffix = contract.getTerminationReason() != null
                ? " Lý do: " + contract.getTerminationReason()
                : "";
        notificationService.notifyContractOrInvoiceEvent(
                contract,
                "Hợp đồng đã thanh lý",
                "Hợp đồng thuê " + contract.getApartment().getAddress()
                        + " đã được thanh lý trước hạn vào " + terminatedAt + "." + reasonSuffix,
                ENotificationType.CONTRACT_TERMINATED
        );

        return EntityToDto.contractToDto(contract);
    }
}
