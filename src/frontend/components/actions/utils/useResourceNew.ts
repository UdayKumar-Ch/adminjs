import ApiClient from "../../../utils/api-client";
import RecordJSON from "../../../../backend/decorators/record-json.interface";
import { NoticeMessage } from "../../../store/with-notice";
import { useState } from "react";
import { useHistory } from "react-router";
import recordToFormData from "../record-to-form-data";
import { appendForceRefresh } from "./append-force-refresh";

const api = new ApiClient();

const useResourceNew = (
  initialRecord: RecordJSON | undefined,
  resourceId: string,
  onNotice: (notice: NoticeMessage) => void
) => {
  const [record, setRecord] = useState({
    ...initialRecord,
    params: initialRecord?.params ?? {},
    errors: initialRecord?.errors ?? {},
    populated: initialRecord?.populated ?? {},
  });
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleChange = (
    propertyOrRecord: RecordJSON | string,
    value?: any
  ): void => {
    if (
      typeof value === "undefined" &&
      (propertyOrRecord as RecordJSON).params
    ) {
      setRecord(propertyOrRecord as RecordJSON);
    } else {
      setRecord(prev => ({
        ...prev,
        params: { ...prev.params, [propertyOrRecord as string]: value }
      }));
    }
  };

  const handleSubmit = (event): boolean => {
    const formData = recordToFormData(record as RecordJSON);
    setLoading(true);
    api
      .resourceAction({
        resourceId,
        actionName: 'new',
        data: formData,
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then(response => {
        if (response.data.notice) {
          onNotice(response.data.notice);
        }
        if (response.data.redirectUrl) {
          history.push(appendForceRefresh(response.data.redirectUrl));
        } else {
          setRecord(prev => ({ ...prev, errors: response.data.record.errors }));
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
        onNotice({
          message:
            "There was an error updating record, Check out console to see more information.",
          type: "error"
        });
      });
    event.preventDefault();
    return false;
  };

  return { record, handleChange, handleSubmit, loading };
};

export default useResourceNew;