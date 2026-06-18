package com.fis.vdbas.exp.application.dossier.service;

import com.fis.vdbas.exp.application.dossier.dto.DossierDraftRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierMutationResult;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import com.fis.vdbas.exp.domain.dossier.ExpDossierDraft;
import com.fis.vdbas.exp.domain.dossier.ExpDossierDraftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service lưu nháp auto-save (DEC-04).
 * <p>Nháp luôn gắn với một hồ sơ ĐÃ TỒN TẠI: hồ sơ được tạo trước (POST create → "lưu thật"),
 * sau đó autosave ghi partial content vào {@code EXP_DOSSIER_DRAFT.CONTENT} theo
 * {@code dossierId} (FK NOT NULL). Autosave KHÔNG tạo hồ sơ mới.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DossierDraftService {

    private final ExpDossierDraftRepository repository;
    private final DossierService dossierService;

    @Transactional
    public DossierMutationResult saveDraft(DossierDraftRequest request) {
        // Nháp gắn vào hồ sơ có sẵn — verify tồn tại (404 nếu không) để thoả FK.
        ExpDossier dossier = dossierService.getActiveOrThrow(request.getDossierId());

        ExpDossierDraft draft = new ExpDossierDraft();
        draft.setDossierId(dossier.getId());
        draft.setStatus(1);
        // TODO: serialize sang JSON chuẩn (vd Jackson) khi thêm dependency; tạm lưu dạng chuỗi.
        draft.setContent(String.valueOf(request));
        repository.save(draft);

        return DossierMutationResult.builder()
                .id(dossier.getId())
                .dossierCode(dossier.getDossierCode())
                .fStatus(dossier.getFStatus())
                .version(dossier.getVersion())
                .build();
    }
}
