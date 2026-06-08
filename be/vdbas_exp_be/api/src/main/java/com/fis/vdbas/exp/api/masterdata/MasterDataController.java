package com.fis.vdbas.exp.api.masterdata;

import com.fis.vdbas.exp.application.masterdata.dto.ProjectInfoDto;
import com.fis.vdbas.exp.application.masterdata.service.ProjectMasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/master-data")
@RequiredArgsConstructor
public class MasterDataController {

    private final ProjectMasterDataService service;

    @GetMapping("/projects")
    public List<ProjectInfoDto> searchProjects(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name) {
        return service.searchProjects(code, name);
    }
}
