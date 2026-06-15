package com.fis.vdbas.exp.application.masterdata.service;

import com.fis.vdbas.exp.application.masterdata.dto.*;
import com.fis.vdbas.exp.application.masterdata.mapper.MasterDataMapper;
import com.fis.vdbas.exp.domain.masterdata.*;
import lombok.RequiredArgsConstructor;
import com.fis.vdbas.common.exception.InvalidOperationException;
import com.fis.vdbas.common.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MasterDataService {

    private final ExpProjectRepository projectRepository;
    private final ExpProjectManagementRepository projectManagementRepository;
    private final CommonTreasuryRepository treasuryRepository;
    private final ExpDocumentTypeRepository documentTypeRepository;
    private final ExpPaymentTypeRepository paymentTypeRepository;
    private final ExpCapitalPlanTypeRepository capitalPlanTypeRepository;
    private final ExpCurrencyTypeRepository currencyTypeRepository;
    private final ExpExchangeRateTypeRepository exchangeRateTypeRepository;
    private final CommonInvestmentSourceRepository investmentSourceRepository;
    private final CommonAllocationCriteriaRepository allocationCriteriaRepository;
    private final ExpProjectItemRepository projectItemRepository;
    private final CommonStateRepository stateRepository;
    private final ExpGuaranteeRepository guaranteeRepository;
    private final MasterDataMapper mapper;
    private final JdbcTemplate jdbcTemplate;

    private static final Set<Integer> VALID_GL_SEGMENTS = Set.of(2, 4, 5, 8, 9, 10, 12, 13);

    public List<ProjectInfoDto> getProjects(String code, String name) {
        List<ExpProject> list = (code == null || code.isBlank()) && (name == null || name.isBlank())
                ? projectRepository.findAll()
                : projectRepository.findByProjectCodeContainingIgnoreCaseOrProjectNameContainingIgnoreCase(
                        code != null ? code : "", name != null ? name : "");

        List<ProjectInfoDto> result = mapper.toProjectInfoDtoList(list);
        result.forEach(dto -> {
            if (dto.getProjectManagementCode() != null) {
                projectManagementRepository.findById(dto.getProjectManagementCode())
                        .ifPresent(pm -> dto.setProjectManagementName(pm.getProjectManagementName()));
            }
        });
        return result;
    }

    public List<TreasuryInfoDto> getTreasuries(String code, String name) {
        return treasuryRepository.findByStatus(1).stream()
                .filter(t -> (code == null || t.getTreasuryCode().contains(code))
                          && (name == null || t.getTreasuryName() == null
                              || t.getTreasuryName().contains(name)))
                .map(mapper::toTreasuryInfoDto)
                .collect(Collectors.toList());
    }

    public List<PaymentTypeDto> getPaymentTypes() {
        return mapper.toPaymentTypeDtoList(paymentTypeRepository.findByStatus(1));
    }

    public List<CodeNameDto> getCapitalPlanTypes() {
        return capitalPlanTypeRepository.findByStatus(1).stream()
                .map(mapper::toCapitalPlanTypeDto).collect(Collectors.toList());
    }

    public List<CodeNameDto> getCurrencyTypes() {
        return currencyTypeRepository.findByStatus(1).stream()
                .map(mapper::toCurrencyTypeDto).collect(Collectors.toList());
    }

    public List<CodeNameDto> getExchangeRateTypes() {
        return exchangeRateTypeRepository.findByStatus(1).stream()
                .map(mapper::toExchangeRateTypeDto).collect(Collectors.toList());
    }

    public List<DocumentTypeDto> getDocumentTypes() {
        return mapper.toDocumentTypeDtoList(documentTypeRepository.findByStatus(1));
    }

    public List<InvestmentSourceDto> getInvestmentSources(String segmentCode) {
        List<CommonInvestmentSource> list = segmentCode != null
                ? investmentSourceRepository.findBySegmentCode(segmentCode)
                : investmentSourceRepository.findAll();
        return list.stream().map(mapper::toInvestmentSourceDto).collect(Collectors.toList());
    }

    public List<CodeNameDto> getAllocationCriteria() {
        return allocationCriteriaRepository.findAll().stream()
                .map(mapper::toAllocationCriteriaDto).collect(Collectors.toList());
    }

    public List<CodeNameDto> getProjectItems(String projectCode) {
        List<ExpProjectItem> list = projectCode != null
                ? projectItemRepository.findByProjectCodeAndStatus(projectCode, 1)
                : projectItemRepository.findByStatus(1);
        return list.stream().map(mapper::toProjectItemDto).collect(Collectors.toList());
    }

    public List<CodeNameDto> getGlSegments(int segmentNo) {
        if (!VALID_GL_SEGMENTS.contains(segmentNo)) {
            throw new InvalidOperationException("INVALID_GL_SEGMENT",
                    null, "Invalid GL segment number: " + segmentNo + ". Valid values: " + VALID_GL_SEGMENTS);
        }
        String table = "COMMON_GL_SEGMENT" + segmentNo;
        // Discover the actual name-column from Oracle data dictionary (column ORDER_ID=2)
        List<String> cols = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = ? ORDER BY COLUMN_ID",
                String.class, table);
        if (cols.isEmpty()) {
            throw new ResourceNotFoundException("GL_SEGMENT_TABLE_NOT_FOUND",
                    null, "Table not found: " + table);
        }
        String codeCol = cols.get(0);
        String nameCol = cols.size() > 1 ? cols.get(1) : cols.get(0);
        return jdbcTemplate.query(
                "SELECT " + codeCol + ", " + nameCol + " FROM " + table + " ORDER BY " + codeCol,
                (rs, rowNum) -> new CodeNameDto(rs.getString(1), rs.getString(2)));
    }

    public List<GuaranteeDto> getGuarantees(String guaranteeNo) {
        List<ExpGuarantee> list = (guaranteeNo != null && !guaranteeNo.isBlank())
                ? guaranteeRepository.findByGuaranteeNoContainingIgnoreCase(guaranteeNo)
                : guaranteeRepository.findAll();
        return mapper.toGuaranteeDtoList(list);
    }

    public List<CodeNameDto> getStates() {
        return stateRepository.findBySubSystemAndStatus("CAPEX", 1).stream()
                .map(mapper::toStateDto).collect(Collectors.toList());
    }
}
