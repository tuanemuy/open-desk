import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import { HeaderColor } from "@/core/domain/system-settings/valueObject";
import type { HeaderColorOutput } from "./dto";

export type UpdateHeaderColorInput = {
  hex: string;
};

export async function updateHeaderColor({
  container,
  input,
}: ServiceArgs<UpdateHeaderColorInput>): Promise<HeaderColorOutput> {
  const headerColor = HeaderColor.create(input.hex);

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("header_color");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "header_color" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, headerColor);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return { hex: headerColor.hex };
}
