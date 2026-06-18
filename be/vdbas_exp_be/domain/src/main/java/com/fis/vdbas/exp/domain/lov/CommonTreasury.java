package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Kho bạc — map bảng {@code COMMON_TREASURY} (chỉ đọc). */
@Entity
@Table(name = "COMMON_TREASURY")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class CommonTreasury {

    @Id
    @Column(name = "TREASURY_CODE", length = 100)
    private String treasuryCode;

    @Column(name = "TREASURY_NAME", length = 500)
    private String treasuryName;
}
