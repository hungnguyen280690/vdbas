package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "EXP_CAPITAL_PLAN_TYPE")
@Getter
@Setter
@NoArgsConstructor
public class ExpCapitalPlanType {

    @Id
    @Column(name = "CAPITAL_PLAN_TYPE_CODE", nullable = false, length = 100)
    private String capitalPlanTypeCode;

    @Column(name = "CAPITAL_PLAN_TYPE_NAME", length = 500)
    private String capitalPlanTypeName;

    @Column(name = "STATUS")
    private Integer status;
}
