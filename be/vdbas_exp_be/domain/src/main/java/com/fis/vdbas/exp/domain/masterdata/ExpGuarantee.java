package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "EXP_GUARANTEE")
@Getter
@Setter
@NoArgsConstructor
public class ExpGuarantee {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "exp_guarantee_seq")
    @SequenceGenerator(name = "exp_guarantee_seq", sequenceName = "SEQ_EXP_GUARANTEE", allocationSize = 1)
    @Column(name = "GUARANTEE_ID", nullable = false, updatable = false)
    private Long guaranteeId;

    @Column(name = "GUARANTEE_NO", length = 100)
    private String guaranteeNo;

    @Column(name = "GUARANTEE_AMOUNT", precision = 19, scale = 2)
    private BigDecimal guaranteeAmount;

    @Column(name = "GUARANTEE_REMAINING_AMOUNT", precision = 19, scale = 2)
    private BigDecimal guaranteeRemainingAmount;

    @Column(name = "GUARANTEE_EXPIRY_DATE")
    private LocalDate guaranteeExpiryDate;
}
