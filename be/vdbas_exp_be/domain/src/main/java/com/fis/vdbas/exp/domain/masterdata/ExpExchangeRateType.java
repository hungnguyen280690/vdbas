package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_EXCHANGE_RATE_TYPE")
@Getter
@Setter
@NoArgsConstructor
public class ExpExchangeRateType {

    @Id
    @Column(name = "EXCHANGE_RATE_TYPE_CODE", nullable = false, length = 100)
    private String exchangeRateTypeCode;

    @Column(name = "EXCHANGE_RATE_TYPE_NAME", length = 500)
    private String exchangeRateTypeName;

    @Column(name = "STATUS")
    private Integer status;
}
