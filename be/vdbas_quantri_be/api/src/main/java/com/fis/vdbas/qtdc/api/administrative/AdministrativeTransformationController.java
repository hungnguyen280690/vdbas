package com.fis.vdbas.qtdc.api.administrative;

import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeTransformationDto;
import com.fis.vdbas.qtdc.application.administrative.servcie.AdministrativeTransformationService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing Administrative Unit transformations.
 * <p>
 * Handles the historical changes and structural shifts of administrative units,
 * such as merging or splitting units.
 * </p>
 */
@RestController
@RequestMapping("/api/administrative-transformations")
@RequiredArgsConstructor
public class AdministrativeTransformationController {

    private final AdministrativeTransformationService service;

    // @GetMapping
    // public List<AdministrativeTransformationDto> all() {
    // return service.findAll();
    // }

    /**
     * Loads transformation details for a specific target unit.
     *
     * @param targetId The ID of the target administrative unit
     * @return List of transformation records associated with the unit
     */
    @GetMapping("/load/{targetId}")
    public List<AdministrativeTransformationDto> load(@PathVariable UUID targetId) {
        return service.load(targetId);
    }

    // @PostMapping
    // public AdministrativeTransformationDto create(@Valid @RequestBody
    // AdministrativeTransformationDto body) {
    // return service.create(body);
    // }

    // @PutMapping("/{id}")
    // public AdministrativeTransformationDto update(@PathVariable UUID id,
    // @Valid @RequestBody AdministrativeTransformationDto body) {
    // return service.update(id, body);
    // }

    // @DeleteMapping("/{id}")
    // public void delete(@PathVariable UUID id) {
    // service.delete(id);
    // }
}
