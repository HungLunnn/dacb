package com.example.demo.service.interfaces;

import com.example.demo.model.DTO.contract.ContractDTO;
import com.example.demo.model.DTO.contract.ContractTerminateDTO;
import com.example.demo.model.DTO.contract.ContractUpdateDTO;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface ContractService {
    Map<String, Object> getAll(Pageable pageable);

    Map<String, Object> getAllByUser(Pageable pageable, String username);

    ContractDTO getContractDTO(String id);

    ContractDTO getContractDTOForUser(String id, String username);

    ContractDTO create(ContractDTO contractDTO);

    ContractDTO create(ContractDTO contractDTO, String token);

    ContractDTO update(String id, ContractUpdateDTO contractUpdate, String token);

    ContractDTO delete(String id);

    Map<String, Object> search(String query, Pageable pageable);

    Map<String, Object> search(String query, Pageable pageable, String token);

    Map<String, Object> statistic(int nowYear);

    ContractDTO terminate(String id, ContractTerminateDTO terminateDTO, String token);
}
