package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "COMMON_INVESTMENT_SOURCE")
@IdClass(CommonInvestmentSourceId.class)
@Getter
@Setter
@NoArgsConstructor
public class CommonInvestmentSource {

    @Id
    @Column(name = "INVESTMENT_SOURCE_CODE", nullable = false, length = 100)
    private String investmentSourceCode;

    @Id
    @Column(name = "SEGMENT_CODE", nullable = false, length = 100)
    private String segmentCode;

    @Column(name = "INVESTMENT_SOURCE_NAME", length = 500)
    private String investmentSourceName;
}
