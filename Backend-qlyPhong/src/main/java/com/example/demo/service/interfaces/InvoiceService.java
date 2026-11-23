package com.example.demo.service.interfaces;

import com.example.demo.enumuration.EInvoiceStatus;
import com.example.demo.model.DTO.invoice.InvoiceCreateDTO;
import com.example.demo.model.DTO.invoice.InvoiceDTO;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface InvoiceService {
    Map<String, Object> getInvoices(String token,
                                    EInvoiceStatus status,
                                    Integer billingMonth,
                                    Integer billingYear,
                                    String contractId,
                                    Pageable pageable);

    InvoiceDTO getInvoiceById(String id, String token);

    Map<String, Object> getLatestMeterReading(String contractId);

    InvoiceDTO createInvoice(InvoiceCreateDTO dto);

    InvoiceDTO markAsPaid(String id);

    InvoiceDTO cancelInvoice(String id);
}
