package com.example.demo.model.DTO.contract;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContractTerminateDTO {
    private String terminatedAt;
    private String reason;
}
