package com.example.demo.model.DTO.invoice;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceCreateDTO {
    private String contractId;
    private Integer billingMonth;
    private Integer billingYear;
    private Double electricOld;
    private Double electricNew;
    private Double waterOld;
    private Double waterNew;
    private Double electricRate;
    private Double waterRate;
    private String dueDate;
}
