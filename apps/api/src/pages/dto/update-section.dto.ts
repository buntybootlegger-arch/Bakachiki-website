import { PartialType } from "@nestjs/mapped-types";
import { CreatePageSectionDto } from "./create-section.dto";

export class UpdatePageSectionDto extends PartialType(CreatePageSectionDto) {}
