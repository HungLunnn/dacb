import PageHeader from "../../components/PageHeader";
import ContractList from "./ContractList";
import IndexToolBar from "../../components/IndexToolBar";
import { useNavigate } from "react-router-dom";

const ContractIndex = () => {
  const navigate = useNavigate();

  const handleNewItem = () => navigate("./add", { state: { from: window.location.pathname } });

  return (
    <>
      <PageHeader>Quản lý hợp đồng</PageHeader>
      <IndexToolBar handleNewItem={handleNewItem} enableImport={false} />
      <ContractList />
    </>
  );
};

export default ContractIndex;
