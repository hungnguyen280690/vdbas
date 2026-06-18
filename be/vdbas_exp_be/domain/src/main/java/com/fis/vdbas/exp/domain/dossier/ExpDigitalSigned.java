package com.fis.vdbas.exp.domain.dossier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Thông tin ký số — map bảng {@code EXP_DIGITAL_SIGNED}.
 * <p>NOTE-03: quan hệ 1-1 với {@link ExpApprovalLog}; ID hai bảng bằng nhau ({@code @MapsId}).</p>
 * <p>TODO (out-of-scope): luồng ký số thực tế (DEC — EXP_DIGITAL_SIGNED) chưa hiện thực.</p>
 */
@Entity
@Table(name = "EXP_DIGITAL_SIGNED")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDigitalSigned {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private ExpApprovalLog approvalLog;

    @Lob
    @Column(name = "SIGNED_CONTENT")
    private String signedContent;

    @Lob
    @Column(name = "SIGNATURE")
    private String signature;

    @Lob
    @Column(name = "CERT")
    private String cert;

    @Column(name = "SIGNED_DATE")
    private LocalDateTime signedDate;
}
