package com.fis.vdbas.exp.application.lov.service;

import com.fis.vdbas.exp.application.lov.dto.AttachmentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.DataSourceItem;
import com.fis.vdbas.exp.application.lov.dto.DocumentTypeItem;
import com.fis.vdbas.exp.application.lov.dto.OrganizationLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectLovItem;
import com.fis.vdbas.exp.application.lov.dto.ProjectSpecificLovItem;
import com.fis.vdbas.exp.application.lov.dto.TreasuryLovItem;
import com.fis.vdbas.exp.application.lov.mapper.LovMapper;
import com.fis.vdbas.exp.common.CacheConstants;
import com.fis.vdbas.exp.domain.lov.CommonOrganizationRepository;
import com.fis.vdbas.exp.domain.lov.CommonTreasuryRepository;
import com.fis.vdbas.exp.domain.lov.ExpAttachmentTypeRepository;
import com.fis.vdbas.exp.domain.lov.ExpDataSourceRepository;
import com.fis.vdbas.exp.domain.lov.ExpDocumentTypeRepository;
import com.fis.vdbas.exp.domain.lov.ExpProject;
import com.fis.vdbas.exp.domain.lov.ExpProjectRepository;
import com.fis.vdbas.exp.domain.lov.ExpProjectSpecificRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service tra cứu danh mục (LOV). Kết quả cache trong {@link CacheConstants#LOV_CACHE}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LovService {

    private static final int ACTIVE = 1;

    private final ExpProjectRepository projectRepository;
    private final ExpProjectSpecificRepository projectSpecificRepository;
    private final CommonTreasuryRepository treasuryRepository;
    private final CommonOrganizationRepository organizationRepository;
    private final ExpDataSourceRepository dataSourceRepository;
    private final ExpDocumentTypeRepository documentTypeRepository;
    private final ExpAttachmentTypeRepository attachmentTypeRepository;
    private final LovMapper mapper;

    public List<ProjectLovItem> projects(String projectCode, String projectName, String projectTypeCode) {
        Specification<ExpProject> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("status"), ACTIVE));
            if (projectCode != null && !projectCode.isBlank()) {
                p.add(cb.like(cb.lower(root.get("projectCode")), "%" + projectCode.toLowerCase() + "%"));
            }
            if (projectName != null && !projectName.isBlank()) {
                p.add(cb.like(cb.lower(root.get("projectName")), "%" + projectName.toLowerCase() + "%"));
            }
            if (projectTypeCode != null && !projectTypeCode.isBlank()) {
                p.add(cb.equal(root.get("projectTypeCode"), projectTypeCode));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
        return mapper.toProjectLovItemList(projectRepository.findAll(spec));
    }

    public List<ProjectSpecificLovItem> projectSpecific(String projectCode) {
        return mapper.toProjectSpecificLovItemList(
                projectSpecificRepository.findByProjectCodeAndStatus(projectCode, ACTIVE));
    }

    public List<TreasuryLovItem> treasuries(String search) {
        String s = search == null ? "" : search;
        return mapper.toTreasuryLovItemList(
                treasuryRepository.findByTreasuryNameContainingIgnoreCaseOrTreasuryCodeContainingIgnoreCase(s, s));
    }

    public List<OrganizationLovItem> organizations(String search) {
        String s = search == null ? "" : search;
        return mapper.toOrganizationLovItemList(
                organizationRepository.findByStatusAndOrganizationNameContainingIgnoreCaseOrStatusAndOrganizationCodeContainingIgnoreCase(
                        ACTIVE, s, ACTIVE, s));
    }

    @Cacheable(value = CacheConstants.LOV_CACHE, key = "'data_sources'")
    public List<DataSourceItem> dataSources() {
        return mapper.toDataSourceItemList(dataSourceRepository.findAll());
    }

    @Cacheable(value = CacheConstants.LOV_CACHE, key = "'document_types'")
    public List<DocumentTypeItem> documentTypes() {
        return mapper.toDocumentTypeItemList(documentTypeRepository.findAll());
    }

    @Cacheable(value = CacheConstants.LOV_CACHE, key = "'attachment_types'")
    public List<AttachmentTypeItem> attachmentTypes() {
        return mapper.toAttachmentTypeItemList(attachmentTypeRepository.findAll());
    }
}
