package com.example.demo.service.implement;

import com.example.demo.entity.Contract;
import com.example.demo.entity.Invoice;
import com.example.demo.enumuration.EContractStatus;
import com.example.demo.enumuration.EInvoiceStatus;
import com.example.demo.enumuration.ENotificationType;
import com.example.demo.exception.ForbiddenException;
import com.example.demo.exception.InValidException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.model.DTO.invoice.InvoiceCreateDTO;
import com.example.demo.model.DTO.invoice.InvoiceDTO;
import com.example.demo.model.DTO.paging.APIPageableDTO;
import com.example.demo.repository.ContractRepository;
import com.example.demo.repository.InvoiceRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.interfaces.InvoiceService;
import com.example.demo.service.interfaces.NotificationService;
import com.example.demo.util.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {
    private static final double DEFAULT_ELECTRIC_RATE = 3000.0;
    private static final double DEFAULT_WATER_RATE = 10000.0;

    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private InvoiceDTO toDto(Invoice invoice) {
        Contract contract = invoice.getContract();
        String customerName = contract != null && contract.getCustomer() != null
                ? contract.getCustomer().getFullName() : null;
        String customerPhone = contract != null && contract.getCustomer() != null
                ? contract.getCustomer().getPhoneNumber() : null;
        String apartmentAddress = contract != null && contract.getApartment() != null
                ? contract.getApartment().getAddress() : null;
        String contractStatus = contract != null && contract.getStatus() != null
                ? contract.getStatus().name() : null;

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .contractId(contract != null ? contract.getId() : null)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .apartmentAddress(apartmentAddress)
                .contractStatus(contractStatus)
                .amount(invoice.getAmount())
                .issueDate(invoice.getIssueDate() == null ? null : invoice.getIssueDate().toString())
                .dueDate(invoice.getDueDate() == null ? null : invoice.getDueDate().toString())
                .status(invoice.getStatus() == null ? null : invoice.getStatus().name())
                .paidAt(invoice.getPaidAt() == null ? null : invoice.getPaidAt().toString())
                .createdAt(invoice.getCreatedAt() == null ? null : invoice.getCreatedAt().toString())
                .billingMonth(invoice.getBillingMonth())
                .billingYear(invoice.getBillingYear())
                .roomAmount(invoice.getRoomAmount())
                .electricOld(invoice.getElectricOld())
                .electricNew(invoice.getElectricNew())
                .electricUsage(invoice.getElectricUsage())
                .electricRate(invoice.getElectricRate())
                .electricAmount(invoice.getElectricAmount())
                .waterOld(invoice.getWaterOld())
                .waterNew(invoice.getWaterNew())
                .waterUsage(invoice.getWaterUsage())
                .waterRate(invoice.getWaterRate())
                .waterAmount(invoice.getWaterAmount())
                .build();
    }

    @Override
    public Map<String, Object> getInvoices(String token,
                                           EInvoiceStatus status,
                                           Integer billingMonth,
                                           Integer billingYear,
                                           String contractId,
                                           Pageable pageable) {
        String cleanContractId = (contractId == null || contractId.trim().isEmpty()) ? null : contractId.trim();
        Page<Invoice> invoicePage;

        if (token != null && "USER".equals(JwtUtil.extractRole(token))) {
            String username = JwtUtil.extractUsername(token);
            String phone = userRepository.findUserByUsername(username)
                    .map(u -> normalizePhone(u.getPhoneNumber()))
                    .orElse(null);
            invoicePage = invoiceRepository.findAllForUserFiltered(
                    username, phone, status, billingMonth, billingYear, cleanContractId, pageable);
        } else {
            invoicePage = invoiceRepository.findAllFiltered(
                    status, billingMonth, billingYear, cleanContractId, pageable);
        }

        Page<InvoiceDTO> dtoPage = invoicePage.map(this::toDto);
        Map<String, Object> result = new HashMap<>();
        result.put("page", new APIPageableDTO(dtoPage));
        result.put("invoices", dtoPage.getContent());
        return result;
    }

    @Override
    public InvoiceDTO getInvoiceById(String id, String token) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));

        if (token != null && "USER".equals(JwtUtil.extractRole(token))) {
            String username = JwtUtil.extractUsername(token);
            String userPhone = userRepository.findUserByUsername(username)
                    .map(u -> normalizePhone(u.getPhoneNumber()))
                    .orElse(null);
            Contract contract = invoice.getContract();
            boolean ownedByUser = contract.getUser() != null && username.equals(contract.getUser().getUsername());
            String customerPhone = contract.getCustomer() == null ? null : normalizePhone(contract.getCustomer().getPhoneNumber());
            boolean matchedByPhone = userPhone != null && userPhone.equals(customerPhone);
            if (!ownedByUser && !matchedByPhone) {
                throw new ForbiddenException();
            }
        }
        return toDto(invoice);
    }

    @Override
    public Map<String, Object> getLatestMeterReading(String contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hợp đồng"));

        Optional<Invoice> latestInvoice = invoiceRepository
                .findTopByContract_IdAndStatusNotOrderByBillingYearDescBillingMonthDesc(contractId, EInvoiceStatus.CANCELLED);

        Map<String, Object> res = new HashMap<>();
        res.put("contractId", contractId);
        res.put("roomAmount", contract.getRetailPrice() != null
                ? contract.getRetailPrice()
                : (contract.getApartment() != null ? contract.getApartment().getRetailPrice() : 0.0));
        if (latestInvoice.isPresent()) {
            Invoice inv = latestInvoice.get();
            res.put("electricOld", inv.getElectricNew() != null ? inv.getElectricNew() : 0.0);
            res.put("waterOld", inv.getWaterNew() != null ? inv.getWaterNew() : 0.0);
            res.put("electricRate", inv.getElectricRate() != null ? inv.getElectricRate() : DEFAULT_ELECTRIC_RATE);
            res.put("waterRate", inv.getWaterRate() != null ? inv.getWaterRate() : DEFAULT_WATER_RATE);
            res.put("lastBillingMonth", inv.getBillingMonth());
            res.put("lastBillingYear", inv.getBillingYear());
        } else {
            res.put("electricOld", 0.0);
            res.put("waterOld", 0.0);
            res.put("electricRate", DEFAULT_ELECTRIC_RATE);
            res.put("waterRate", DEFAULT_WATER_RATE);
            res.put("lastBillingMonth", null);
            res.put("lastBillingYear", null);
        }
        return res;
    }

    @Override
    @Transactional
    public InvoiceDTO createInvoice(InvoiceCreateDTO dto) {
        if (dto == null || dto.getContractId() == null || dto.getContractId().trim().isEmpty()
                || dto.getBillingMonth() == null || dto.getBillingYear() == null) {
            throw new InValidException("Vui lòng chọn hợp đồng và kỳ hóa đơn (tháng/năm)");
        }
        if (dto.getBillingMonth() < 1 || dto.getBillingMonth() > 12) {
            throw new InValidException("Tháng hóa đơn phải nằm trong khoảng từ 1 đến 12");
        }
        if (dto.getBillingYear() < 2000 || dto.getBillingYear() > 2100) {
            throw new InValidException("Năm hóa đơn không hợp lệ");
        }

        Contract contract = contractRepository.findById(dto.getContractId().trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hợp đồng"));

        // Kiểm tra trạng thái hợp đồng
        LocalDate today = LocalDate.now();
        if (contract.getStatus() == EContractStatus.TERMINATED) {
            throw new InValidException("Không thể tạo hóa đơn cho hợp đồng đã thanh lý");
        }
        if (contract.getStatus() == EContractStatus.EXPIRED
                || (contract.getEndDate() != null && contract.getEndDate().isBefore(today))) {
            if (contract.getStatus() != EContractStatus.EXPIRED) {
                contract.setStatus(EContractStatus.EXPIRED);
                contractRepository.save(contract);
            }
            throw new InValidException("Không thể tạo hóa đơn cho hợp đồng đã hết hạn");
        }
        if (contract.getStatus() == EContractStatus.DRAFT) {
            throw new InValidException("Hợp đồng chưa có hiệu lực (DRAFT), chưa thể tạo hóa đơn");
        }

        if (invoiceRepository.existsByContract_IdAndBillingMonthAndBillingYear(
                contract.getId(), dto.getBillingMonth(), dto.getBillingYear())) {
            throw new InValidException("Hóa đơn kỳ " + dto.getBillingMonth() + "/" + dto.getBillingYear() + " của hợp đồng này đã tồn tại");
        }

        double electricOld = dto.getElectricOld() == null ? 0.0 : dto.getElectricOld();
        double electricNew = dto.getElectricNew() == null ? electricOld : dto.getElectricNew();
        double waterOld = dto.getWaterOld() == null ? 0.0 : dto.getWaterOld();
        double waterNew = dto.getWaterNew() == null ? waterOld : dto.getWaterNew();
        double electricRate = dto.getElectricRate() == null ? DEFAULT_ELECTRIC_RATE : dto.getElectricRate();
        double waterRate = dto.getWaterRate() == null ? DEFAULT_WATER_RATE : dto.getWaterRate();

        if (electricOld < 0 || electricNew < 0 || waterOld < 0 || waterNew < 0) {
            throw new InValidException("Chỉ số điện/nước không được là số âm");
        }
        if (electricRate < 0 || waterRate < 0) {
            throw new InValidException("Đơn giá điện/nước không được là số âm");
        }
        if (electricNew < electricOld || waterNew < waterOld) {
            throw new InValidException("Chỉ số điện/nước mới không được nhỏ hơn chỉ số cũ");
        }

        LocalDate dueDate;
        if (dto.getDueDate() == null || dto.getDueDate().trim().isEmpty()) {
            dueDate = today.plusDays(7);
        } else {
            try {
                dueDate = LocalDate.parse(dto.getDueDate().trim());
            } catch (DateTimeParseException e) {
                throw new InValidException("Định dạng hạn thanh toán không hợp lệ (cần yyyy-MM-dd)");
            }
        }
        if (dueDate.isBefore(today)) {
            throw new InValidException("Hạn thanh toán không được nhỏ hơn ngày lập hóa đơn");
        }

        double electricUsage = electricNew - electricOld;
        double waterUsage = waterNew - waterOld;
        double electricAmount = electricUsage * electricRate;
        double waterAmount = waterUsage * waterRate;
        double roomAmount = contract.getRetailPrice() != null
                ? contract.getRetailPrice()
                : (contract.getApartment() != null ? contract.getApartment().getRetailPrice() : 0.0);
        double amount = roomAmount + electricAmount + waterAmount;

        String suffix = contract.getId().substring(0, Math.min(8, contract.getId().length())).toUpperCase();
        String invoiceNumber = String.format("INV-%d-%02d-%s", dto.getBillingYear(), dto.getBillingMonth(), suffix);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .contract(contract)
                .billingMonth(dto.getBillingMonth())
                .billingYear(dto.getBillingYear())
                .roomAmount(roomAmount)
                .electricOld(electricOld)
                .electricNew(electricNew)
                .electricUsage(electricUsage)
                .electricRate(electricRate)
                .electricAmount(electricAmount)
                .waterOld(waterOld)
                .waterNew(waterNew)
                .waterUsage(waterUsage)
                .waterRate(waterRate)
                .waterAmount(waterAmount)
                .amount(amount)
                .issueDate(today)
                .dueDate(dueDate)
                .status(EInvoiceStatus.UNPAID)
                .build();

        Invoice saved = invoiceRepository.save(invoice);

        String formattedAmount = String.format("%,.0f", amount);
        String address = contract.getApartment() != null ? contract.getApartment().getAddress() : "";
        String notificationMessage = "Hóa đơn " + invoiceNumber + " kỳ " + dto.getBillingMonth() + "/" + dto.getBillingYear()
                + (address.isEmpty() ? "" : " (" + address + ")")
                + " đã được tạo. Tổng tiền: " + formattedAmount + " VNĐ. Hạn thanh toán: " + dueDate + ".";

        notificationService.notifyContractOrInvoiceEvent(
                contract,
                "Phiếu hóa đơn mới",
                notificationMessage,
                ENotificationType.INVOICE_CREATED
        );

        return toDto(saved);
    }

    @Override
    @Transactional
    public InvoiceDTO markAsPaid(String id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));

        if (invoice.getStatus() == EInvoiceStatus.PAID) {
            throw new InValidException("Hóa đơn này đã được thanh toán trước đó");
        }
        if (invoice.getStatus() == EInvoiceStatus.CANCELLED) {
            throw new InValidException("Không thể thanh toán hóa đơn đã hủy");
        }

        invoice.setStatus(EInvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        Invoice saved = invoiceRepository.save(invoice);

        String formattedAmount = String.format("%,.0f", saved.getAmount());
        String paidMessage = "Hóa đơn " + saved.getInvoiceNumber() + " kỳ "
                + saved.getBillingMonth() + "/" + saved.getBillingYear()
                + " (" + formattedAmount + " VNĐ) đã được xác nhận thanh toán.";

        notificationService.notifyContractOrInvoiceEvent(
                saved.getContract(),
                "Hóa đơn đã thanh toán",
                paidMessage,
                ENotificationType.INVOICE_PAID
        );

        return toDto(saved);
    }

    @Override
    @Transactional
    public InvoiceDTO cancelInvoice(String id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));

        if (invoice.getStatus() == EInvoiceStatus.PAID) {
            throw new InValidException("Không thể hủy hóa đơn đã thanh toán");
        }
        if (invoice.getStatus() == EInvoiceStatus.CANCELLED) {
            throw new InValidException("Hóa đơn này đã được hủy trước đó");
        }

        invoice.setStatus(EInvoiceStatus.CANCELLED);
        Invoice saved = invoiceRepository.save(invoice);

        String cancelMessage = "Hóa đơn " + saved.getInvoiceNumber() + " kỳ "
                + saved.getBillingMonth() + "/" + saved.getBillingYear()
                + " đã bị hủy bởi quản lý.";

        notificationService.notifyContractOrInvoiceEvent(
                saved.getContract(),
                "Hóa đơn đã hủy",
                cancelMessage,
                ENotificationType.SYSTEM
        );

        return toDto(saved);
    }
}
