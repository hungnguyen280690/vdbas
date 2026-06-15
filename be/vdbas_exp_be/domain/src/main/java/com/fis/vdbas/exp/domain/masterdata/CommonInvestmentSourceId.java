package com.fis.vdbas.exp.domain.masterdata;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class CommonInvestmentSourceId implements Serializable {
    private String investmentSourceCode;
    private String segmentCode;
}
