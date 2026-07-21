import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { IdeProvider } from "@/hooks/use-ide-state";
import Ide from "@/pages/ide";

const router = createBrowserRouter([{ path: "/", element: <Ide /> }]);

export default function App() {
  return (
    <IdeProvider>
      <RouterProvider router={router} />
    </IdeProvider>
  );
}
