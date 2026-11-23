package com.example.demo.controller;

import com.example.demo.enumuration.EInvoiceStatus;
import com.example.demo.model.DTO.invoice.InvoiceCreateDTO;
import com.example.demo.response.ApiResponse;
import com.example.demo.service.interfaces.InvoiceService;
import com.example.demo.util.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/invoices")
@AllArgsConstructor
public class InvoiceController {
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<Object> getInvoices(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int pageSize,
                                              @RequestParam(required = false) EInvoiceStatus status,
                                              @RequestParam(required = false) Integer billingMonth,
                                              @RequestParam(required = false) Integer billingYear,
                                              @RequestParam(required = false) String contractId,
                                              HttpServletRequest request) {
        Pageable pageable = PageRequest.of(
                page,
                pageSize,
                Sort.by(Sort.Order.desc("billingYear"), Sort.Order.desc("billingMonth"), Sort.Order.desc("issueDate"))
        );
        String token = JwtUtil.getTokenFromRequest(request);
        return ApiResponse.responseBuilder(
                HttpStatus.OK,
                "Success",
                invoiceService.getInvoices(token, status, billingMonth, billingYear, contractId, pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getInvoiceById(@PathVariable String id, HttpServletRequest request) {
        String token = JwtUtil.getTokenFromRequest(request);
        return ApiResponse.responseBuilder(HttpStatus.OK, "Success", invoiceService.getInvoiceById(id, token));
    }

    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('STAFF')")
    @GetMapping("/latest-meter")
    public ResponseEntity<Object> getLatestMeterReading(@RequestParam String contractId) {
        return ApiResponse.responseBuilder(HttpStatus.OK, "Success", invoiceService.getLatestMeterReading(contractId));
    }

    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('STAFF')")
    @PostMapping("/create")
    public ResponseEntity<Object> createInvoice(@RequestBody InvoiceCreateDTO dto) {
        return ApiResponse.responseBuilder(HttpStatus.CREATED, "Tạo hóa đơn thành công", invoiceService.createInvoice(dto));
    }

    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('STAFF')")
    @PostMapping("/{id}/pay")
    public ResponseEntity<Object> markAsPaid(@PathVariable String id) {
        return ApiResponse.responseBuilder(HttpStatus.OK, "Xác nhận thanh toán thành công", invoiceService.markAsPaid(id));
    }

    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('STAFF')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Object> cancelInvoice(@PathVariable String id) {
        return ApiResponse.responseBuilder(HttpStatus.OK, "Hủy hóa đơn thành công", invoiceService.cancelInvoice(id));
    }
}
