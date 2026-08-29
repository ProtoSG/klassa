package com.klassa.student;

import com.klassa.student.dto.FamilyResponse;
import com.klassa.student.dto.StudentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface StudentMapper {

    @Mapping(target = "fullName", expression = "java(student.fullName())")
    @Mapping(target = "familyId", source = "family.id")
    @Mapping(target = "guardianName", source = "family.guardianName")
    @Mapping(target = "guardianPhone", source = "family.guardianPhone")
    StudentResponse toResponse(Student student);

    @Mapping(target = "linkedUserEmail", expression = "java(family.getGuardianUser() != null ? family.getGuardianUser().getEmail() : null)")
    FamilyResponse toFamilyResponse(Family family);
}
