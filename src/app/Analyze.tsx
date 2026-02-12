import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FileUpload from "@/components/analyze/FileUpload";
import AnalysisLoading from "@/components/analyze/AnalysisLoading";
import AnalysisResultView from "@/components/analyze/AnalysisResult";
import { useAnalysis } from "@/hooks/useAnalysis";

const Analyze = () => {
  const { analyzeFile, reset, isUploading, isAnalyzing, result, error, filename } = useAnalysis();

  const isLoading = isUploading || isAnalyzing;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {!isLoading && !result && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                  Analysez votre contrat
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                  Uploadez un contrat et obtenez un rapport détaillé en quelques secondes.
                </p>
              </div>
              <FileUpload onFileSelected={analyzeFile} error={error} />
            </>
          )}

          {isLoading && <AnalysisLoading />}

          {result && (
            <AnalysisResultView result={result} filename={filename} onReset={reset} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analyze;
