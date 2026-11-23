package com.example.demo.entity;

import com.example.demo.enumuration.EInvoiceStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "invoice",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_invoice_contract_period",
                        columnNames = {"contract_id", "billing_month", "billing_year"}
                )
        },
        indexes = {
                @Index(name = "idx_invoice_contract", columnList = "contract_id"),
                @Index(name = "idx_invoice_status", columnList = "status"),
                @Index(name = "idx_invoice_period", columnList = "billing_year, billing_month")
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, insertable = false)
    private String id;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @ManyToOne
    @JoinColumn(name = "contract_id", nullable = false)
    @JsonIgnore
    private Contract contract;

    @Column(name = "billing_month", nullable = false)
    private Integer billingMonth;

    @Column(name = "billing_year", nullable = false)
    private Integer billingYear;

    @Column(name = "room_amount", nullable = false)
    private Double roomAmount;

    @Column(name = "electric_old")
    private Double electricOld;

    @Column(name = "electric_new")
    private Double electricNew;

    @Column(name = "electric_usage")
    private Double electricUsage;

    @Column(name = "electric_rate", nullable = false)
    private Double electricRate;

    @Column(name = "electric_amount", nullable = false)
    private Double electricAmount;

    @Column(name = "water_old")
    private Double waterOld;

    @Column(name = "water_new")
    private Double waterNew;

    @Column(name = "water_usage")
    private Double waterUsage;

    @Column(name = "water_rate", nullable = false)
    private Double waterRate;

    @Column(name = "water_amount", nullable = false)
    private Double waterAmount;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EInvoiceStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
