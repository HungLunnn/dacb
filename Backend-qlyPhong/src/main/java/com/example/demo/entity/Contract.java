package com.example.demo.entity;

import com.example.demo.enumuration.EContractStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "contract",
        indexes = {
                @Index(name = "idx_contract_apartment", columnList = "apartment_id"),
                @Index(name = "idx_contract_customer", columnList = "customer_id"),
                @Index(name = "idx_contract_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EntityListeners(AuditingEntityListener.class)
public class Contract {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, insertable = false)
    private String id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private Double total;

    @Column(name = "retail_price")
    private Double retailPrice;

    @Column(name = "create_date", updatable = false, nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    @CreatedDate
    private LocalDate createDate;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EContractStatus status;

    @Column(name = "terminated_at")
    private LocalDate terminatedAt;

    @Column(name = "termination_reason", length = 1000)
    private String terminationReason;
}
