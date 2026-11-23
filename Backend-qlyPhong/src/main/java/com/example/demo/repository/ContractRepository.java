package com.example.demo.repository;

import com.example.demo.entity.Contract;
import com.example.demo.enumuration.EContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, String> {
    @Query("SELECT c FROM Contract c WHERE " +
            "LOWER(c.apartment.address) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.customer.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(CAST(c.status AS string)) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Contract> search(@Param("query") String query, Pageable pageable);

    @Query("SELECT c FROM Contract c WHERE " +
            "(c.user.username = :username OR (:phone IS NOT NULL AND c.customer.phoneNumber = :phone)) AND (" +
            "LOWER(c.apartment.address) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.customer.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.customer.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(CAST(c.status AS string)) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Contract> searchForUser(@Param("query") String query,
                                 @Param("username") String username,
                                 @Param("phone") String phone,
                                 Pageable pageable);

    List<Contract> getContractsByApartment_Id(String apartmentId);

    List<Contract> getContractsByCustomer_Id(String customerId);

    @Query("select coalesce(sum(c.total), 0) from Contract c")
    double getTotalAmount();

    Page<Contract> findAllByUser_Username(String username, Pageable pageable);

    @Query("SELECT c FROM Contract c WHERE c.user.username = :username OR (:phone IS NOT NULL AND c.customer.phoneNumber = :phone)")
    Page<Contract> findAllForUserByUsernameOrPhone(@Param("username") String username, @Param("phone") String phone, Pageable pageable);

    List<Contract> findAllByStatusInAndEndDateBefore(Collection<EContractStatus> statuses, LocalDate date);

    List<Contract> findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            EContractStatus status, LocalDate startBound, LocalDate endBound);

    boolean existsByApartment_IdAndStatus(String apartmentId, EContractStatus status);
}
