import * as fs from 'fs';
import * as path from 'path';

// Load all controllers from the controllers directory by root path project
export function loadControllers(projectRootPath: string) {
  const controllersPath = path.join(projectRootPath, 'src/controllers');
  const names: string[] = [];

  fs.readdirSync(controllersPath).map((file) => {
    const controllerPath = path.join(controllersPath, file);
    names.push(controllerPath);
    return require(controllerPath);
  });

  return names;
}
