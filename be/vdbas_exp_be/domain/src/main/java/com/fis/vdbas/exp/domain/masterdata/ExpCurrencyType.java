package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_CURRENCY_TYPE")
@Getter
@Setter
@NoArgsConstructor
public class ExpCurrencyType {

    @Id
    @Column(name = "CURRENCY_TYPE_CODE", nullable = false, length = 100)
    private String currencyTypeCode;

    @Column(name = "CURRENCY_TYPE_NAME", length = 500)
    private String currencyTypeName;

    @Column(name = "STATUS")
    private Integer status;
}
