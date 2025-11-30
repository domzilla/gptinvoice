import { parseArgs, isValidMonthFormat, getHelpText } from '../src/cli';

describe('cli', () => {
  describe('parseArgs', () => {
    it('should return default options when no args provided', () => {
      const options = parseArgs([]);

      expect(options.outputDir).toBe(process.cwd());
      expect(options.downloadAll).toBe(false);
      expect(options.month).toBeNull();
      expect(options.showHelp).toBe(false);
      expect(options.clearConfig).toBe(false);
      expect(options.debug).toBe(false);
    });

    it('should parse -h flag', () => {
      const options = parseArgs(['-h']);
      expect(options.showHelp).toBe(true);
    });

    it('should parse -help flag', () => {
      const options = parseArgs(['-help']);
      expect(options.showHelp).toBe(true);
    });

    it('should parse --help flag', () => {
      const options = parseArgs(['--help']);
      expect(options.showHelp).toBe(true);
    });

    it('should parse --all flag', () => {
      const options = parseArgs(['--all']);
      expect(options.downloadAll).toBe(true);
    });

    it('should parse --clear flag', () => {
      const options = parseArgs(['--clear']);
      expect(options.clearConfig).toBe(true);
    });

    it('should parse --debug flag', () => {
      const options = parseArgs(['--debug']);
      expect(options.debug).toBe(true);
    });

    it('should parse -output option', () => {
      const options = parseArgs(['-output', '/custom/path']);
      expect(options.outputDir).toBe('/custom/path');
    });

    it('should parse -month option', () => {
      const options = parseArgs(['-month', '2024-01']);
      expect(options.month).toBe('2024-01');
    });

    it('should parse multiple options together', () => {
      const options = parseArgs(['--all', '-output', './invoices', '-month', '2024-06']);

      expect(options.downloadAll).toBe(true);
      expect(options.outputDir).toBe('./invoices');
      expect(options.month).toBe('2024-06');
    });

    it('should exit on invalid month format', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => parseArgs(['-month', 'invalid'])).toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalled();

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should exit on unknown option', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => parseArgs(['--unknown'])).toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalled();

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('isValidMonthFormat', () => {
    it('should return true for valid YYYY-MM format', () => {
      expect(isValidMonthFormat('2024-01')).toBe(true);
      expect(isValidMonthFormat('2024-12')).toBe(true);
      expect(isValidMonthFormat('2023-06')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidMonthFormat('2024-1')).toBe(false);
      expect(isValidMonthFormat('2024-13')).toBe(false);
      expect(isValidMonthFormat('2024-00')).toBe(false);
      expect(isValidMonthFormat('24-01')).toBe(false);
      expect(isValidMonthFormat('2024/01')).toBe(false);
      expect(isValidMonthFormat('January 2024')).toBe(false);
      expect(isValidMonthFormat('')).toBe(false);
    });
  });

  describe('getHelpText', () => {
    it('should return help text containing usage information', () => {
      const helpText = getHelpText();

      expect(helpText).toContain('gptinvoice');
      expect(helpText).toContain('USAGE');
      expect(helpText).toContain('OPTIONS');
      expect(helpText).toContain('-output');
      expect(helpText).toContain('--all');
      expect(helpText).toContain('--clear');
      expect(helpText).toContain('--debug');
      expect(helpText).toContain('-month');
      expect(helpText).toContain('-h');
      expect(helpText).toContain('EXAMPLES');
    });
  });
});
