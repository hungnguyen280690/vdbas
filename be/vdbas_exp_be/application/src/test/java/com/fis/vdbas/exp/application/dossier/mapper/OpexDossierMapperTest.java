package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.OpexDossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierUpdateRequest;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm chứng MapStruct {@link OpexDossierMapper}: chỉ map field user-input OPEX, KHÔNG rò rỉ
 * field backend-managed/audit/id/immutable từ request.
 */
class OpexDossierMapperTest {

    private final OpexDossierMapper mapper = Mappers.getMapper(OpexDossierMapper.class);

    @Test
    void toEntity_mapsUserInput_andDoesNotLeakBackendManagedFields() {
        OpexDossierCreateRequest req = new OpexDossierCreateRequest();
        req.setOrganizationCode("ORG01");
        req.setTreasuryCode("KB01");
        req.setSendDate(LocalDate.of(2026, 6, 19));
        req.setDataSourceCode("THU_CONG");

        ExpDossier entity = mapper.toEntity(req);

        // field user-input được map
        assertThat(entity.getOrganizationCode()).isEqualTo("ORG01");
        assertThat(entity.getTreasuryCode()).isEqualTo("KB01");
        assertThat(entity.getSendDate()).isEqualTo(LocalDate.of(2026, 6, 19));
        assertThat(entity.getDataSourceCode()).isEqualTo("THU_CONG");

        // backend-managed/audit/id KHÔNG nhận từ request
        assertThat(entity.getId()).isNull();
        assertThat(entity.getFStatus()).isNull();
        assertThat(entity.getDossierCode()).isNull();
        assertThat(entity.getWorkflowCode()).isNull();
        assertThat(entity.getDossierTypeCode()).isNull();
        assertThat(entity.getAssignUser()).isNull();
        assertThat(entity.getCreatedBy()).isNull();
        assertThat(entity.getUpdatedBy()).isNull();
        assertThat(entity.getOrganizationName()).isNull();
        assertThat(entity.getTreasuryName()).isNull();
    }

    @Test
    void updateEntityFromDto_updatesMutableFields_keepsBackendManaged() {
        ExpDossier entity = new ExpDossier();
        UUID id = UUID.randomUUID();
        entity.setId(id);
        entity.setOrganizationCode("OLD_ORG");
        entity.setTreasuryCode("OLD_KB");
        entity.setSendDate(LocalDate.of(2026, 1, 1));
        entity.setDataSourceCode("THU_CONG");      // immutable VAL-17
        entity.setDossierCode("EXP/OPEX/ABC");      // immutable
        entity.setDossierTypeCode("OPEX");          // immutable
        entity.setFStatus(DossierStatus.DRAFT);
        entity.setVersion(3);
        entity.setCreatedBy("maker01");
        entity.setCreatedDate(LocalDateTime.of(2026, 1, 1, 8, 0));

        OpexDossierUpdateRequest req = new OpexDossierUpdateRequest();
        req.setVersion(3);
        req.setOrganizationCode("NEW_ORG");
        req.setTreasuryCode("NEW_KB");
        req.setSendDate(LocalDate.of(2026, 6, 19));

        mapper.updateEntityFromDto(req, entity);

        // mutable OPEX cập nhật
        assertThat(entity.getOrganizationCode()).isEqualTo("NEW_ORG");
        assertThat(entity.getTreasuryCode()).isEqualTo("NEW_KB");
        assertThat(entity.getSendDate()).isEqualTo(LocalDate.of(2026, 6, 19));

        // immutable/backend/audit/id giữ nguyên
        assertThat(entity.getId()).isEqualTo(id);
        assertThat(entity.getDataSourceCode()).isEqualTo("THU_CONG");
        assertThat(entity.getDossierCode()).isEqualTo("EXP/OPEX/ABC");
        assertThat(entity.getDossierTypeCode()).isEqualTo("OPEX");
        assertThat(entity.getFStatus()).isEqualTo(DossierStatus.DRAFT);
        assertThat(entity.getVersion()).isEqualTo(3);
        assertThat(entity.getCreatedBy()).isEqualTo("maker01");
        assertThat(entity.getCreatedDate()).isEqualTo(LocalDateTime.of(2026, 1, 1, 8, 0));
    }
}
