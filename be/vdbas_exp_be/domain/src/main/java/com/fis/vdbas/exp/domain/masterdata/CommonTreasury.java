package com.fis.vdbas.exp.domain.masterdata;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "COMMON_TREASURY")
@Getter
@Setter
@NoArgsConstructor
public class CommonTreasury {

    @Id
    @Column(name = "TREASURY_CODE", nullable = false, length = 100)
    private String treasuryCode;

    @Column(name = "TREASURY_NAME", length = 500)
    private String treasuryName;

    @Column(name = "STATUS")
    private Integer status;
}
