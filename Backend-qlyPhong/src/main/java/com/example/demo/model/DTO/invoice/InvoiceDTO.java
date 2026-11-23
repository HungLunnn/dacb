package com.example.demo.model.DTO.invoice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDTO {
    private String id;
    private String invoiceNumber;
    private String contractId;
    private String customerName;
    private String customerPhone;
    private String apartmentAddress;
    private String contractStatus;
    private Double amount;
    private String issueDate;
    private String dueDate;
    private String status;
    private String paidAt;
    private String createdAt;
    private Integer billingMonth;
    private Integer billingYear;
    private Double roomAmount;
    private Double electricOld;
    private Double electricNew;
    private Double electricUsage;
    private Double electricRate;
    private Double electricAmount;
    private Double waterOld;
    private Double waterNew;
    private Double waterUsage;
    private Double waterRate;
    private Double waterAmount;
}
