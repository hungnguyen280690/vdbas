package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_PAYMENT_TYPE")
@Getter
@Setter
@NoArgsConstructor
public class ExpPaymentType {

    @Id
    @Column(name = "PAYMENT_TYPE_CODE", nullable = false, length = 100)
    private String paymentTypeCode;

    @Column(name = "PAYMENT_TYPE_NAME", length = 500)
    private String paymentTypeName;

    @Column(name = "STATUS")
    private Integer status;
}
