package com.example.demo.repository;

import com.example.demo.entity.Invoice;
import com.example.demo.enumuration.EInvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Optional<Invoice> findByContract_Id(String contractId);

    Page<Invoice> findAllByContract_User_Username(String username, Pageable pageable);

    boolean existsByContract_Id(String contractId);

    boolean existsByContract_IdAndBillingMonthAndBillingYear(String contractId, Integer billingMonth, Integer billingYear);

    long countByContract_IdAndStatus(String contractId, EInvoiceStatus status);

    Optional<Invoice> findTopByContract_IdAndStatusNotOrderByBillingYearDescBillingMonthDesc(
            String contractId, EInvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.contract.user.username = :username OR (:phone IS NOT NULL AND i.contract.customer.phoneNumber = :phone)")
    Page<Invoice> findAllForUserByUsernameOrPhone(@Param("username") String username, @Param("phone") String phone, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:billingMonth IS NULL OR i.billingMonth = :billingMonth) AND " +
            "(:billingYear IS NULL OR i.billingYear = :billingYear) AND " +
            "(:contractId IS NULL OR i.contract.id = :contractId)")
    Page<Invoice> findAllFiltered(@Param("status") EInvoiceStatus status,
                                  @Param("billingMonth") Integer billingMonth,
                                  @Param("billingYear") Integer billingYear,
                                  @Param("contractId") String contractId,
                                  Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
            "(i.contract.user.username = :username OR (:phone IS NOT NULL AND i.contract.customer.phoneNumber = :phone)) AND " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:billingMonth IS NULL OR i.billingMonth = :billingMonth) AND " +
            "(:billingYear IS NULL OR i.billingYear = :billingYear) AND " +
            "(:contractId IS NULL OR i.contract.id = :contractId)")
    Page<Invoice> findAllForUserFiltered(@Param("username") String username,
                                         @Param("phone") String phone,
                                         @Param("status") EInvoiceStatus status,
                                         @Param("billingMonth") Integer billingMonth,
                                         @Param("billingYear") Integer billingYear,
                                         @Param("contractId") String contractId,
                                         Pageable pageable);
}
